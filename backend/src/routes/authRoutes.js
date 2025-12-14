const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const Otp = require('../models/Otp');
const PasswordResetOtp = require('../models/PasswordResetOtp');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');

function generate4DigitOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.pbkdf2Sync(String(password), String(salt), 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(String(expectedHash), 'hex'));
}

function looksLikeEmail(value) {
  const v = String(value || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function splitFullName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      fullName,
      phone,
      username,
      email,
      identifier,
      role,
      password,
      profileImageDataUrl,
    } = req.body || {};

    const nameFromFull = fullName ? splitFullName(fullName) : null;
    const resolvedFirstName = String((firstName || nameFromFull?.firstName || '')).trim();
    const resolvedLastName = String((lastName || nameFromFull?.lastName || '')).trim();

    const resolvedIdentifier = String(username || identifier || '').trim();
    const resolvedEmail = email ? String(email).trim() : (looksLikeEmail(resolvedIdentifier) ? resolvedIdentifier : undefined);

    if (!resolvedFirstName || !phone || !resolvedIdentifier || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedPhone = String(phone).trim();

    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone already registered' });
    }

    const existingUsername = await User.findOne({ username: resolvedIdentifier });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    if (resolvedEmail) {
      const existingEmail = await User.findOne({ email: resolvedEmail });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    const { salt, hash } = hashPassword(password);

    const code = generate4DigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otpDoc = await Otp.create({
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      phone: normalizedPhone,
      username: resolvedIdentifier,
      email: resolvedEmail,
      role: role ? String(role).trim() : undefined,
      passwordHash: hash,
      passwordSalt: salt,
      profileImageDataUrl: profileImageDataUrl ? String(profileImageDataUrl) : undefined,
      code,
      expiresAt,
      used: false,
    });

    return res.status(201).json({
      success: true,
      otpId: otpDoc._id,
      otp: code,
      expiresAt,
    });
  } catch (err) {
    console.error('Error in /api/auth/register', err);
    return res.status(500).json({ message: 'Failed to register' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { otpId, code } = req.body || {};

    if (!otpId || !code) {
      return res.status(400).json({ message: 'Missing otpId or code' });
    }

    const otpDoc = await Otp.findById(otpId);
    if (!otpDoc) {
      return res.status(404).json({ message: 'OTP not found' });
    }

    if (otpDoc.used) {
      return res.status(400).json({ message: 'OTP already used' });
    }

    if (otpDoc.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (String(otpDoc.code) !== String(code)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpDoc.used = true;
    await otpDoc.save();

    let profileImageUrl;
    if (otpDoc.profileImageDataUrl && typeof otpDoc.profileImageDataUrl === 'string') {
      const upload = await cloudinary.uploader.upload(otpDoc.profileImageDataUrl, {
        folder: 'profiles',
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
      });
      profileImageUrl = upload.secure_url;
    }

    const user = await User.create({
      firstName: otpDoc.firstName,
      lastName: otpDoc.lastName,
      phone: otpDoc.phone,
      username: otpDoc.username,
      email: otpDoc.email,
      role: otpDoc.role,
      passwordHash: otpDoc.passwordHash,
      passwordSalt: otpDoc.passwordSalt,
      profileImageUrl,
      isVerified: true,
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    const token = jwt.sign(
      {
        userId: user?._id,
        phone: user?.phone,
        username: user?.username,
      },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({ success: true, token, user });
  } catch (err) {
    console.error('Error in /api/auth/verify-otp', err);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, identifier, password } = req.body || {};
    const resolvedIdentifier = String(username || identifier || '').trim();
    if (!resolvedIdentifier || !password) {
      return res.status(400).json({ message: 'Missing username or password' });
    }

    const user = await User.findOne({
      $or: [{ username: resolvedIdentifier }, { email: resolvedIdentifier }],
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified' });
    }

    const ok = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone, username: user.username },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({ success: true, token, user });
  } catch (err) {
    console.error('Error in /api/auth/login', err);
    return res.status(500).json({ message: 'Failed to login' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier, username, phone } = req.body || {};
    const resolvedIdentifier = String(identifier || username || '').trim();
    const normalizedPhone = String(phone || '').trim();

    if (!resolvedIdentifier) {
      return res.status(400).json({ message: 'Missing username' });
    }

    const query = {
      $or: [{ username: resolvedIdentifier }, { email: resolvedIdentifier }],
    };

    if (normalizedPhone) {
      query.phone = normalizedPhone;
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const maskedPhone = user?.phone
      ? String(user.phone).replace(/.(?=.{2})/g, '*')
      : 'your phone number';

    const code = generate4DigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otpDoc = await PasswordResetOtp.create({
      userId: user._id,
      code,
      expiresAt,
      used: false,
    });

    return res.status(201).json({
      success: true,
      resetOtpId: otpDoc._id,
      otp: code,
      target: maskedPhone,
      expiresAt,
    });
  } catch (err) {
    console.error('Error in /api/auth/forgot-password', err);
    return res.status(500).json({ message: 'Failed to request password reset' });
  }
});

router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { resetOtpId, code } = req.body || {};
    if (!resetOtpId || !code) {
      return res.status(400).json({ message: 'Missing resetOtpId or code' });
    }

    const otpDoc = await PasswordResetOtp.findById(resetOtpId);
    if (!otpDoc) {
      return res.status(404).json({ message: 'OTP not found' });
    }

    if (otpDoc.used) {
      return res.status(400).json({ message: 'OTP already used' });
    }

    if (otpDoc.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (String(otpDoc.code) !== String(code)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpDoc.used = true;
    await otpDoc.save();

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    const resetToken = jwt.sign(
      { userId: otpDoc.userId, type: 'password_reset' },
      secret,
      { expiresIn: '15m' }
    );

    return res.json({ success: true, resetToken });
  } catch (err) {
    console.error('Error in /api/auth/verify-reset-otp', err);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body || {};
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Missing reset token or new password' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    let payload;
    try {
      payload = jwt.verify(String(resetToken), secret);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    if (payload?.type !== 'password_reset' || !payload?.userId) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { salt, hash } = hashPassword(newPassword);
    user.passwordSalt = salt;
    user.passwordHash = hash;
    await user.save();

    return res.json({ success: true });
  } catch (err) {
    console.error('Error in /api/auth/reset-password', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash -passwordSalt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ success: true, user });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
});

module.exports = router;
