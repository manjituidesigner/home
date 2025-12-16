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

router.get('/sent', auth, async (req, res) => {
  try {
    const tenantId = req.user?.userId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const offers = await Offer.find({ tenantId })
      .sort({ createdAt: -1 })
      .populate(
        'propertyId',
        'propertyName address city location rentAmount advanceAmount bookingAdvance bookingValidityDays parkingType preferredTenantTypes photos'
      )
      .populate('ownerId', 'firstName lastName username phone profileImageUrl city rating starRating');

    return res.json({ success: true, count: offers.length, offers });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch offers' });
  }
});

router.patch('/:offerId/request-advance', auth, async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const { offerId } = req.params;
    const { requestedAdvanceAmount, requestedAdvanceValidityDays, proposedMeetingTime, desiredJoiningDate } = req.body || {};

    if (!offerId) return res.status(400).json({ message: 'offerId is required' });

    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (String(offer.ownerId) !== String(ownerId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const amount = Number(requestedAdvanceAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'requestedAdvanceAmount must be a valid number' });
    }

    const validityDaysRaw = requestedAdvanceValidityDays;
    const validityDays = validityDaysRaw === '' || validityDaysRaw == null ? null : Number(validityDaysRaw);
    if (validityDays != null) {
      if (!Number.isFinite(validityDays) || validityDays <= 0) {
        return res.status(400).json({ message: 'requestedAdvanceValidityDays must be a valid number' });
      }
    }

    const meeting = proposedMeetingTime ? new Date(proposedMeetingTime) : null;
    if (meeting && Number.isNaN(meeting.getTime())) {
      return res.status(400).json({ message: 'proposedMeetingTime must be a valid date' });
    }

    const joining = desiredJoiningDate ? new Date(desiredJoiningDate) : null;
    if (joining && Number.isNaN(joining.getTime())) {
      return res.status(400).json({ message: 'desiredJoiningDate must be a valid date' });
    }

    offer.requestedAdvanceAmount = amount;
    offer.requestedAdvanceValidityDays = validityDays == null ? undefined : Math.floor(validityDays);
    offer.proposedMeetingTime = meeting || undefined;
    offer.desiredJoiningDate = joining || undefined;
    offer.actionType = 'advance_requested';
    await offer.save();

    return res.json({ success: true, offer });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to send request' });
  }
});

router.patch('/:offerId/status', auth, async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const { offerId } = req.params;
    const { status } = req.body || {};

    const nextStatus = String(status || '').trim().toLowerCase();
    if (!offerId) return res.status(400).json({ message: 'offerId is required' });
    if (!nextStatus) return res.status(400).json({ message: 'status is required' });

    if (!['rejected', 'on_hold', 'pending', 'accepted'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (String(offer.ownerId) !== String(ownerId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    offer.status = nextStatus;
    await offer.save();

    return res.json({ success: true, offer });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to update offer status' });
  }
});

router.patch('/:offerId/confirm-move-in', auth, async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const { offerId } = req.params;
    if (!offerId) return res.status(400).json({ message: 'offerId is required' });

    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (String(offer.ownerId) !== String(ownerId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (String(offer.status || '').toLowerCase() !== 'accepted') {
      return res.status(400).json({ message: 'Offer is not accepted' });
    }

    if (!offer.bookingVerified) {
      return res.status(400).json({ message: 'Booking payment is not verified yet' });
    }

    offer.tenantMoveInConfirmed = true;
    offer.tenantMoveInConfirmedAt = new Date();
    await offer.save();

    return res.json({ success: true, offer });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to confirm tenant move-in' });
  }
});

router.get('/history/:propertyId/:tenantId', auth, async (req, res) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) return res.status(401).json({ message: 'Unauthorized' });

    const { propertyId, tenantId } = req.params;
    if (!propertyId || !tenantId) {
      return res.status(400).json({ message: 'propertyId and tenantId are required' });
    }

    const offers = await Offer.find({ ownerId, propertyId, tenantId })
      .sort({ createdAt: -1 })
      .select({
        offerRent: 1,
        joiningDateEstimate: 1,
        offerAdvance: 1,
        offerBookingAmount: 1,
        status: 1,
        actionType: 1,
        requestedAdvanceAmount: 1,
        requestedAdvanceValidityDays: 1,
        proposedMeetingTime: 1,
        desiredJoiningDate: 1,
        createdAt: 1,
      });

    return res.json({ success: true, offers });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch offer history' });
  }
});

module.exports = router;
