const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const User = require('../models/User');
const cloudinary = require('../../config/cloudinary');

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash -passwordSalt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ success: true, user });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const {
      dob,
      currentAddress,
      permanentAddress,
      permanentAddressSameAsCurrent,
      additionalAddresses,
      profileImageDataUrl,
    } = req.body || {};

    const update = {};
    if (typeof dob === 'string') update.dob = dob;
    if (currentAddress && typeof currentAddress === 'object') update.currentAddress = currentAddress;
    if (permanentAddress && typeof permanentAddress === 'object') update.permanentAddress = permanentAddress;
    if (typeof permanentAddressSameAsCurrent === 'boolean') {
      update.permanentAddressSameAsCurrent = permanentAddressSameAsCurrent;
    }
    if (Array.isArray(additionalAddresses)) update.additionalAddresses = additionalAddresses;

    if (profileImageDataUrl && typeof profileImageDataUrl === 'string') {
      const base64Part = profileImageDataUrl.split(',')[1] || '';
      const approxBytes = (base64Part.length * 3) / 4;
      const maxBytes = 5 * 1024 * 1024;
      if (approxBytes > maxBytes) {
        return res.status(413).json({ message: 'Image size is larger than 5MB. Please choose a smaller file.' });
      }

      const upload = await cloudinary.uploader.upload(profileImageDataUrl, {
        folder: 'profiles',
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
      });
      update.profileImageUrl = upload.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user.userId, { $set: update }, { new: true })
      .select('-passwordHash -passwordSalt');

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ success: true, user });
  } catch (e) {
    const err = e || {};
    console.error('Failed to update profile:', {
      message: err.message,
      name: err.name,
      http_code: err.http_code,
      code: err.code,
      stack: err.stack,
    });

    // Cloudinary tends to return useful fields like `http_code` and `message`
    const status = typeof err.http_code === 'number' ? err.http_code : 500;
    const message = typeof err.message === 'string' && err.message.trim().length
      ? err.message
      : 'Failed to update profile';

    return res.status(status).json({ message });
  }
});

module.exports = router;
