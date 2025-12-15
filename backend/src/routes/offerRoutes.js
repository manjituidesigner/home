const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const Offer = require('../models/Offer');
const Property = require('../models/Property');
const mongoose = require('mongoose');

router.post('/', auth, async (req, res) => {
  try {
    try {
      console.log('[POST /api/offers] readyState:', mongoose.connection.readyState);
      console.log('[POST /api/offers] userId:', req.user?.userId);
      console.log('[POST /api/offers] body keys:', Object.keys(req.body || {}));
      console.log('[POST /api/offers] propertyId:', req.body?.propertyId);
    } catch (e) {}
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    const { propertyId, offer } = req.body || {};
    const tenantId = req.user?.userId;

    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });
    if (!propertyId) return res.status(400).json({ message: 'propertyId is required' });

    const property = await Property.findById(propertyId).select('ownerId');
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const offerRent = Number(offer?.offerRent);
    const joiningDateEstimate = String(offer?.joiningDateEstimate || '').trim();

    if (!Number.isFinite(offerRent) || offerRent <= 0) {
      return res.status(400).json({ message: 'offerRent must be a valid number' });
    }
    if (!joiningDateEstimate) {
      return res.status(400).json({ message: 'joiningDateEstimate is required' });
    }

    const doc = new Offer({
      propertyId,
      ownerId: property.ownerId,
      tenantId,
      offerRent,
      joiningDateEstimate,
      offerAdvance: offer?.offerAdvance == null ? undefined : Number(offer.offerAdvance),
      offerBookingAmount: offer?.offerBookingAmount == null ? undefined : Number(offer.offerBookingAmount),
      needsBikeParking: !!offer?.needsBikeParking,
      needsCarParking: !!offer?.needsCarParking,
      tenantType: offer?.tenantType ? String(offer.tenantType).trim() : undefined,
      acceptsRules: !!offer?.acceptsRules,
      matchPercent: Number.isFinite(Number(offer?.matchPercent)) ? Number(offer.matchPercent) : 0,
    });

    await doc.save();

    try {
      console.log('[POST /api/offers] saved offerId:', doc?._id);
    } catch (e) {}

    return res.status(201).json({ success: true, offer: doc });
  } catch (e) {
    console.error('[POST /api/offers] error:', e);
    return res.status(500).json({ message: 'Failed to submit offer' });
  }
});

router.get('/received', auth, async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const offers = await Offer.find({ ownerId })
      .sort({ createdAt: -1 })
      .populate(
        'propertyId',
        'propertyName address city location rentAmount advanceAmount bookingAdvance bookingValidityDays parkingType preferredTenantTypes photos',
      )
      .populate('tenantId', 'firstName lastName username phone profileImageUrl city rating starRating');

    return res.json({ success: true, count: offers.length, offers });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch offers' });
  }
});

module.exports = router;
