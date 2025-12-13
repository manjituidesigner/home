const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const User = require('../models/User');

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
    const { dob, currentAddress, permanentAddress } = req.body || {};

    const update = {};
    if (typeof dob === 'string') update.dob = dob;
    if (currentAddress && typeof currentAddress === 'object') update.currentAddress = currentAddress;
    if (permanentAddress && typeof permanentAddress === 'object') update.permanentAddress = permanentAddress;

    const user = await User.findByIdAndUpdate(req.user.userId, { $set: update }, { new: true })
      .select('-passwordHash -passwordSalt');

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ success: true, user });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
