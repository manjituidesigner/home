const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const Otp = require('../models/Otp');
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

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, phone, username, email, role, password, profileImageDataUrl } = req.body || {};

    if (!firstName || !lastName || !phone || !username || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedPhone = String(phone).trim();

    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone already registered' });
    }

    const existingUsername = await User.findOne({ username: String(username).trim() });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const { salt, hash } = hashPassword(password);

    const code = generate4DigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otpDoc = await Otp.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      phone: normalizedPhone,
      username: String(username).trim(),
      email: email ? String(email).trim() : undefined,
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
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'Missing username or password' });
    }

    const user = await User.findOne({ username: String(username).trim() });
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
