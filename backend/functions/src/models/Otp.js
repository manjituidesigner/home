const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, required: true, index: true },
    username: { type: String, trim: true, required: true },
    email: { type: String, trim: true },
    role: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    profileImageDataUrl: { type: String },
    code: { type: String, trim: true, required: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', OtpSchema);
