const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    offerRent: { type: Number, required: true },
    joiningDateEstimate: { type: String, trim: true, required: true },
    offerAdvance: { type: Number },
    offerBookingAmount: { type: Number },
    needsBikeParking: { type: Boolean, default: false },
    needsCarParking: { type: Boolean, default: false },
    tenantType: { type: String, trim: true },
    acceptsRules: { type: Boolean, default: false },
    matchPercent: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

OfferSchema.index({ ownerId: 1, propertyId: 1, createdAt: -1 });
OfferSchema.index({ tenantId: 1, propertyId: 1, createdAt: -1 });

module.exports = mongoose.model('Offer', OfferSchema);
