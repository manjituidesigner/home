const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    roomName: { type: String, trim: true },
    roomSize: { type: String, trim: true },
    roomCount: { type: String, default: '1' },
    roomBhk: { type: String, default: '1BHK' },
    roomFloor: { type: String, trim: true },
    roomRent: { type: String, trim: true },
  },
  { _id: false }
);

const PropertySchema = new mongoose.Schema(
  {
    propertyName: { type: String, trim: true, required: true },
    category: { type: String, enum: ['flat', 'house', 'pg', 'commercial'], default: 'flat' },
    listingType: { type: String, enum: ['rent', 'sell', 'pg'], default: 'rent' },
    bhk: { type: String, default: '1BHK' },
    furnishing: { type: String, enum: ['semi', 'full', 'unfurnished'], default: 'semi' },
    mode: { type: String, enum: ['full', 'room'], default: 'full' },
    rentRoomScope: { type: String, trim: true },
    floor: { type: String, trim: true },
    customFloor: { type: String, trim: true },
    // Financial details
    rentAmount: { type: String, trim: true },
    advanceAmount: { type: String, trim: true },
    waterCharges: { type: String, trim: true },
    electricityPerUnit: { type: String, trim: true },
    cleaningCharges: { type: String, trim: true },
    foodCharges: { type: String, trim: true },
    yearlyMaintenance: { type: String, trim: true },
    yearlyIncreasePercent: { type: String, trim: true },
    bookingAdvance: { type: String, trim: true },
    bookingValidityDays: { type: String, trim: true },
    amenities: [{ type: String, trim: true }],
    photos: [{ type: String, trim: true }],
    rooms: { type: [RoomSchema], default: [] },
    // Tenant rules & preferences
    drinksPolicy: { type: String, enum: ['not_allowed', 'allowed', 'conditional'], default: 'not_allowed' },
    smokingPolicy: { type: String, enum: ['not_allowed', 'allowed', 'conditional'], default: 'not_allowed' },
    lateNightPolicy: { type: String, enum: ['not_allowed', 'allowed', 'conditional'], default: 'not_allowed' },
    lateNightMode: { type: String, enum: ['anytime', 'till_time'], default: 'anytime' },
    lateNightLastTime: { type: String, trim: true },
    visitorsAllowed: { type: String, enum: ['yes', 'no'], default: 'no' },
    visitorsMaxDays: { type: String, trim: true },
    noticePeriodDays: { type: String, trim: true },
    parkingType: { type: String, enum: ['none', 'bike', 'car', 'both'], default: 'none' },
    parkingBikeCount: { type: String, trim: true },
    parkingCarCount: { type: String, trim: true },
    preferredTenantTypes: [{ type: String, trim: true }],
    totalRooms: { type: String, trim: true },
    // Availability status for listing visibility
    status: {
      type: String,
      enum: ['available', 'occupied'],
      default: 'available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Property', PropertySchema);
