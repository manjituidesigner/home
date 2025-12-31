const mongoose = require('mongoose');

const RentMonthRecordSchema = new mongoose.Schema(
  {
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true, index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    rentMonth: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidAt: { type: Date },

    paymentTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTransaction' },
  },
  { timestamps: true },
);

RentMonthRecordSchema.index({ offerId: 1, rentMonth: 1 }, { unique: true });
RentMonthRecordSchema.index({ ownerId: 1, rentMonth: -1, status: 1 });
RentMonthRecordSchema.index({ tenantId: 1, rentMonth: -1, status: 1 });

module.exports = mongoose.model('RentMonthRecord', RentMonthRecordSchema);
