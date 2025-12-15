const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const Offer = require('../models/Offer');
const Property = require('../models/Property');

router.post('/', auth, async (req, res) => {
  try {
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

    const doc = await Offer.create({
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

    return res.status(201).json({ success: true, offer: doc });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to submit offer' });
  }
});

router.get('/received', auth, async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const offers = await Offer.find({ ownerId })
      .sort({ createdAt: -1 })
      .populate('propertyId', 'propertyName address rentAmount advanceAmount bookingAdvance bookingValidityDays parkingType preferredTenantTypes')
      .populate('tenantId', 'firstName username phone profileImageUrl');

    return res.json({ success: true, offers });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch offers' });
  }
});

module.exports = router;
