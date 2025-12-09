const express = require('express');
const router = express.Router();
const propertyService = require('../services/propertyService');

router.post('/', async (req, res) => {
  try {
    const property = await propertyService.createProperty(req.body);
    res.status(201).json(property);
  } catch (err) {
    console.error('Error creating property', err);
    res.status(400).json({ message: 'Failed to create property', error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const properties = await propertyService.listProperties();
    res.json(properties);
  } catch (err) {
    console.error('Error listing properties', err);
    res.status(500).json({ message: 'Failed to list properties' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (err) {
    console.error('Error fetching property', err);
    res.status(400).json({ message: 'Failed to fetch property', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await propertyService.updateProperty(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Error updating property', err);
    res.status(400).json({ message: 'Failed to update property', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await propertyService.deleteProperty(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting property', err);
    res.status(400).json({ message: 'Failed to delete property', error: err.message });
  }
});

module.exports = router;
