const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    years: { type: String, trim: true },
    months: { type: String, trim: true },
  },
  { _id: false }
);

 const NamedAddressSchema = new mongoose.Schema(
   {
     name: { type: String, trim: true },
     address: { type: String, trim: true },
     city: { type: String, trim: true },
     district: { type: String, trim: true },
     state: { type: String, trim: true },
     country: { type: String, trim: true },
   },
   { _id: false }
 );

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, required: true, index: true },
    username: { type: String, trim: true, required: true },
    email: { type: String, trim: true },
    role: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    profileImageUrl: { type: String, trim: true },
    dob: { type: String, trim: true },
    currentAddress: { type: AddressSchema, default: {} },
    permanentAddress: { type: AddressSchema, default: {} },
    permanentAddressSameAsCurrent: { type: Boolean, default: false },
    additionalAddresses: { type: [NamedAddressSchema], default: [] },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ phone: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
