const mongoose = require('mongoose');

const AgreementSchema = new mongoose.Schema(
  {
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true, index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    propertySnapshot: {
      propertyName: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      imageUrl: { type: String, trim: true },
    },

    ownerSnapshot: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },

    tenantSnapshot: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      address: { type: String, trim: true },
    },

    booking: {
      amount: { type: Number },
      paidAt: { type: Date },
      verifiedAt: { type: Date },
      transactionId: { type: String, trim: true },
    },

    rent: {
      monthlyRent: { type: Number },
      advanceRent: { type: Number },
      joiningDate: { type: Date },
      advanceRentDate: { type: Date },
      monthlyPayableDay: { type: Number },
      plannedStayMonths: { type: Number },
    },

    charges: {
      waterBill: { type: String, trim: true },
      electricityPerUnit: { type: Number },
      extraNotes: { type: String, trim: true },
    },

    tenantDetails: {
      familyMembers: { type: String, trim: true },
      vehicleDetails: { type: String, trim: true },
    },

    status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected'], default: 'sent', index: true },
  },
  { timestamps: true },
);

AgreementSchema.index({ offerId: 1, createdAt: -1 });

module.exports = mongoose.model('Agreement', AgreementSchema);
