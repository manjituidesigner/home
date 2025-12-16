const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const Offer = require('../models/Offer');
const PaymentTransaction = require('../models/PaymentTransaction');
const RentMonthRecord = require('../models/RentMonthRecord');

function randomTxnId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TXN_${ts}_${rnd}`;
}

router.post('/create', auth, async (req, res) => {
  try {
    const tenantId = req.user?.userId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const { offerId } = req.body || {};
    if (!offerId) return res.status(400).json({ message: 'offerId is required' });

    const offer = await Offer.findById(offerId)
      .populate('propertyId', 'propertyName address city')
      .populate('ownerId', 'firstName lastName username');

    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (String(offer.tenantId) !== String(tenantId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const amount = Number(offer?.requestedAdvanceAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Offer does not have a valid requestedAdvanceAmount' });
    }

    // Reuse existing transaction if one exists for this offer and is paid/created.
    const existing = await PaymentTransaction.findOne({ offerId: offer._id })
      .sort({ createdAt: -1 })
      .populate('propertyId', 'propertyName address city')
      .populate('tenantId', 'firstName lastName username')
      .populate('ownerId', 'firstName lastName username');

    if (existing) {
      return res.json({ success: true, transaction: existing, reused: true });
    }

    let transactionId = randomTxnId();
    // extremely low collision probability; still ensure uniqueness
    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      const dup = await PaymentTransaction.findOne({ transactionId });
      if (!dup) break;
      transactionId = randomTxnId();
    }

    const tx = new PaymentTransaction({
      offerId: offer._id,
      propertyId: offer.propertyId?._id || offer.propertyId,
      tenantId: offer.tenantId,
      ownerId: offer.ownerId,
      paymentType: 'booking',
      amount,
      currency: 'INR',
      transactionId,
      status: 'created',
    });

    await tx.save();

    const populated = await PaymentTransaction.findById(tx._id)
      .populate('propertyId', 'propertyName address city')
      .populate('tenantId', 'firstName lastName username')
      .populate('ownerId', 'firstName lastName username');

    return res.status(201).json({ success: true, transaction: populated });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to create payment transaction' });
  }
});

router.patch('/:transactionId/mark-paid', auth, async (req, res) => {
  try {
    const tenantId = req.user?.userId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const { transactionId } = req.params;
    if (!transactionId) return res.status(400).json({ message: 'transactionId is required' });

    const tx = await PaymentTransaction.findOne({ transactionId });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    if (String(tx.tenantId) !== String(tenantId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (tx.status !== 'paid') {
      tx.status = 'paid';
      tx.paidAt = new Date();
      await tx.save();
    }

    const populated = await PaymentTransaction.findById(tx._id)
      .populate('propertyId', 'propertyName address city')
      .populate('tenantId', 'firstName lastName username')
      .populate('ownerId', 'firstName lastName username');

    return res.json({ success: true, transaction: populated });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to mark payment as paid' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const tenantId = req.user?.userId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const list = await PaymentTransaction.find({ tenantId })
      .sort({ createdAt: -1 })
      .populate('propertyId', 'propertyName address city')
      .populate('ownerId', 'firstName lastName username');

    return res.json({ success: true, count: list.length, payments: list });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

router.post('/rent/create', auth, async (req, res) => {
  try {
    const tenantId = req.user?.userId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const { offerId, rentMonth } = req.body || {};
    if (!offerId) return res.status(400).json({ message: 'offerId is required' });
    if (!rentMonth) return res.status(400).json({ message: 'rentMonth is required' });

    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (String(offer.tenantId) !== String(tenantId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (String(offer.status || '').toLowerCase() !== 'accepted') {
      return res.status(400).json({ message: 'Offer is not accepted' });
    }

    const month = String(rentMonth).trim();
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'rentMonth must be in YYYY-MM format' });
    }

    const amount = Number(offer.offerRent);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Offer does not have a valid offerRent' });
    }

    const existing = await PaymentTransaction.findOne({ offerId: offer._id, paymentType: 'rent', rentMonth: month })
      .sort({ createdAt: -1 })
      .populate('propertyId', 'propertyName address city')
      .populate('tenantId', 'firstName lastName username')
      .populate('ownerId', 'firstName lastName username');

    if (existing) {
      return res.json({ success: true, transaction: existing, reused: true });
    }

    let transactionId = randomTxnId();
    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      const dup = await PaymentTransaction.findOne({ transactionId });
      if (!dup) break;
      transactionId = randomTxnId();
    }

    const tx = new PaymentTransaction({
      offerId: offer._id,
      propertyId: offer.propertyId,
      tenantId: offer.tenantId,
      ownerId: offer.ownerId,
      paymentType: 'rent',
      rentMonth: month,
      amount,
      currency: 'INR',
      transactionId,
      status: 'created',
    });

    await tx.save();

    const populated = await PaymentTransaction.findById(tx._id)
      .populate('propertyId', 'propertyName address city')
      .populate('tenantId', 'firstName lastName username')
      .populate('ownerId', 'firstName lastName username');

    return res.status(201).json({ success: true, transaction: populated });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to create rent transaction' });
  }
});

router.get('/incoming', auth, async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const { paymentType, ownerVerified, status } = req.query || {};
    const filter = { ownerId };

    if (paymentType) filter.paymentType = String(paymentType).trim().toLowerCase();
    if (ownerVerified != null && String(ownerVerified).trim() !== '') {
      const v = String(ownerVerified).trim().toLowerCase();
      if (v === 'true' || v === '1') filter.ownerVerified = true;
      if (v === 'false' || v === '0') filter.ownerVerified = false;
    }
    if (status) filter.status = String(status).trim().toLowerCase();

    const list = await PaymentTransaction.find(filter)
      .sort({ createdAt: -1 })
      .populate('propertyId', 'propertyName address city')
      .populate('tenantId', 'firstName lastName username phone email currentAddress')
      .populate('offerId');

    return res.json({ success: true, count: list.length, payments: list });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

router.patch('/:transactionId/verify', auth, async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const { transactionId } = req.params;
    if (!transactionId) return res.status(400).json({ message: 'transactionId is required' });

    const tx = await PaymentTransaction.findOne({ transactionId });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    if (String(tx.ownerId) !== String(ownerId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    tx.ownerVerified = true;
    tx.ownerVerifiedAt = new Date();
    await tx.save();

    try {
      if (String(tx.status || '').toLowerCase() === 'paid' && tx.offerId) {
        const offer = await Offer.findById(tx.offerId);
        if (offer && String(offer.status || '').toLowerCase() === 'accepted') {
          const joinDate = offer.desiredJoiningDate ? new Date(offer.desiredJoiningDate) : null;
          if (joinDate && !Number.isNaN(joinDate.getTime())) {
            const dueDay = joinDate.getDate();

            if (String(tx.paymentType || '').toLowerCase() === 'booking') {
              try {
                offer.bookingVerified = true;
                offer.bookingVerifiedAt = tx.ownerVerifiedAt || new Date();
                await offer.save();
              } catch (e) {}

              const now = new Date();
              const rentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

              const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
              const amount = Number(offer.offerRent);
              if (Number.isFinite(amount) && amount > 0) {
                await RentMonthRecord.updateOne(
                  { offerId: offer._id, rentMonth },
                  {
                    $setOnInsert: {
                      offerId: offer._id,
                      propertyId: offer.propertyId,
                      tenantId: offer.tenantId,
                      ownerId: offer.ownerId,
                      rentMonth,
                      dueDate,
                      amount,
                      currency: 'INR',
                      status: 'pending',
                    },
                  },
                  { upsert: true },
                );
              }
            }

            if (String(tx.paymentType || '').toLowerCase() === 'rent') {
              const rentMonth = String(tx.rentMonth || '').trim();
              if (rentMonth) {
                await RentMonthRecord.updateOne(
                  { offerId: offer._id, rentMonth },
                  {
                    $set: {
                      status: 'paid',
                      paidAt: tx.ownerVerifiedAt || new Date(),
                      paymentTransactionId: tx._id,
                    },
                  },
                );
              }
            }
          }
        }
      }
    } catch (e) {}

    const populated = await PaymentTransaction.findById(tx._id)
      .populate('propertyId', 'propertyName address city')
      .populate('tenantId', 'firstName lastName username')
      .populate('ownerId', 'firstName lastName username');

    return res.json({ success: true, transaction: populated });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to verify payment' });
  }
});

module.exports = router;
