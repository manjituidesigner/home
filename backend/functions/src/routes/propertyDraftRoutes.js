const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const propertyDraftService = require('../services/propertyDraftService');

router.post('/', auth, async (req, res) => {
  try {
    const draft = await propertyDraftService.createDraft(req.user.userId, req.body);
    res.status(201).json(draft);
  } catch (err) {
    console.error('Error creating property draft', err);
    res.status(400).json({ message: 'Failed to create property draft', error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const drafts = await propertyDraftService.listDrafts(req.user.userId);
    res.json(drafts);
  } catch (err) {
    console.error('Error listing property drafts', err);
    res.status(500).json({ message: 'Failed to list property drafts' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const draft = await propertyDraftService.getDraftById(req.user.userId, req.params.id);
    if (!draft) return res.status(404).json({ message: 'Property draft not found' });
    res.json(draft);
  } catch (err) {
    console.error('Error fetching property draft', err);
    res.status(400).json({ message: 'Failed to fetch property draft', error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await propertyDraftService.updateDraft(req.user.userId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Property draft not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating property draft', err);
    res.status(400).json({ message: 'Failed to update property draft', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await propertyDraftService.deleteDraft(req.user.userId, req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Property draft not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting property draft', err);
    res.status(400).json({ message: 'Failed to delete property draft', error: err.message });
  }
});

router.post('/:id/publish', auth, async (req, res) => {
  try {
    const created = await propertyDraftService.publishDraft(req.user.userId, req.params.id);
    if (!created) return res.status(404).json({ message: 'Property draft not found' });
    res.status(201).json(created);
  } catch (err) {
    console.error('Error publishing property draft', err);
    res.status(400).json({ message: 'Failed to publish property draft', error: err.message });
  }
});

module.exports = router;
