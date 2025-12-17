const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const RentMonthRecord = require('../models/RentMonthRecord');

router.get('/incoming', auth, async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const { status, rentMonth } = req.query || {};

    const filter = { ownerId };
    if (status) filter.status = String(status).trim().toLowerCase();
    if (rentMonth) filter.rentMonth = String(rentMonth).trim();

    const list = await RentMonthRecord.find(filter)
      .sort({ dueDate: -1, createdAt: -1 })
      .populate('propertyId', 'propertyName address city')
      .populate('tenantId', 'firstName lastName username')
      .populate('ownerId', 'firstName lastName username')
      .populate('paymentTransactionId', 'transactionId status ownerVerified paidAt');

    return res.json({ success: true, count: list.length, rents: list });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch rent records' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const tenantId = req.user?.userId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const { status, rentMonth } = req.query || {};

    const filter = { tenantId };
    if (status) filter.status = String(status).trim().toLowerCase();
    if (rentMonth) filter.rentMonth = String(rentMonth).trim();

    const list = await RentMonthRecord.find(filter)
      .sort({ dueDate: -1, createdAt: -1 })
      .populate('propertyId', 'propertyName address city')
      .populate('tenantId', 'firstName lastName username')
      .populate('ownerId', 'firstName lastName username')
      .populate('paymentTransactionId', 'transactionId status ownerVerified paidAt');

    return res.json({ success: true, count: list.length, rents: list });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch rent records' });
  }
});

module.exports = router;
