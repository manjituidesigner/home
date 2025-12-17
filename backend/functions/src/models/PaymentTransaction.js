const mongoose = require('mongoose');

const PaymentTransactionSchema = new mongoose.Schema(
  {
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    paymentType: { type: String, enum: ['booking', 'rent'], default: 'booking', index: true },
    rentMonth: { type: String, trim: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    transactionId: { type: String, required: true, unique: true },

    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },

    paidAt: { type: Date },

    ownerVerified: { type: Boolean, default: false },
    ownerVerifiedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
