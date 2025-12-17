const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const Agreement = require('../models/Agreement');
const Offer = require('../models/Offer');
const PaymentTransaction = require('../models/PaymentTransaction');

router.post('/create', auth, async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      offerId,
      paymentTransactionId,
      propertySnapshot,
      ownerSnapshot,
      tenantSnapshot,
      booking,
      rent,
      charges,
      tenantDetails,
    } = req.body || {};

    if (!offerId) return res.status(400).json({ message: 'offerId is required' });

    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (String(offer.ownerId) !== String(ownerId)) return res.status(403).json({ message: 'Forbidden' });

    let tx = null;
    if (paymentTransactionId) {
      tx = await PaymentTransaction.findById(paymentTransactionId);
      if (!tx) return res.status(404).json({ message: 'Payment transaction not found' });
      if (String(tx.ownerId) !== String(ownerId)) return res.status(403).json({ message: 'Forbidden' });
    }

    const doc = new Agreement({
      offerId: offer._id,
      propertyId: offer.propertyId,
      tenantId: offer.tenantId,
      ownerId: offer.ownerId,
      propertySnapshot: propertySnapshot && typeof propertySnapshot === 'object' ? propertySnapshot : undefined,
      ownerSnapshot: ownerSnapshot && typeof ownerSnapshot === 'object' ? ownerSnapshot : undefined,
      tenantSnapshot: tenantSnapshot && typeof tenantSnapshot === 'object' ? tenantSnapshot : undefined,
      booking:
        booking && typeof booking === 'object'
          ? booking
          : tx
            ? {
                amount: tx.amount,
                paidAt: tx.paidAt,
                verifiedAt: tx.ownerVerifiedAt,
                transactionId: tx.transactionId,
              }
            : undefined,
      rent: rent && typeof rent === 'object' ? rent : undefined,
      charges: charges && typeof charges === 'object' ? charges : undefined,
      tenantDetails: tenantDetails && typeof tenantDetails === 'object' ? tenantDetails : undefined,
      status: 'sent',
    });

    await doc.save();

    const populated = await Agreement.findById(doc._id)
      .populate('propertyId', 'propertyName address city')
      .populate('tenantId', 'firstName lastName username email phone')
      .populate('ownerId', 'firstName lastName username email phone');

    return res.status(201).json({ success: true, agreement: populated });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to create agreement' });
  }
});

router.get('/incoming', auth, async (req, res) => {
  try {
    const tenantId = req.user?.userId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const list = await Agreement.find({ tenantId })
      .sort({ createdAt: -1 })
      .populate('propertyId', 'propertyName address city')
      .populate('ownerId', 'firstName lastName username email phone');

    return res.json({ success: true, count: list.length, agreements: list });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch agreements' });
  }
});

router.get('/sent', auth, async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const list = await Agreement.find({ ownerId })
      .sort({ createdAt: -1 })
      .populate('propertyId', 'propertyName address city')
      .populate('tenantId', 'firstName lastName username email phone');

    return res.json({ success: true, count: list.length, agreements: list });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch agreements' });
  }
});

module.exports = router;
