const express = require('express');
const router = express.Router();
const cloudinary = require('../../config/cloudinary');
const propertyService = require('../services/propertyService');
const auth = require('../middleware/auth');

// Upload single property image to Cloudinary.
// Expects JSON body: { dataUrl: 'data:image/jpeg;base64,...' }
router.post('/upload-image', async (req, res) => {
  try {
    const { dataUrl } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ message: 'No image data provided' });
    }

    // Optional basic size guard (5MB) based on base64 length
    const base64Part = dataUrl.split(',')[1] || '';
    const approxBytes = (base64Part.length * 3) / 4;
    const maxBytes = 5 * 1024 * 1024;
    if (approxBytes > maxBytes) {
      return res.status(413).json({
        message: 'Image size is larger than 5MB. Please choose a smaller file.',
      });
    }

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: 'properties',
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    });

    return res.status(201).json({ url: result.secure_url });
  } catch (err) {
    console.error('Error uploading image to Cloudinary', err);
    return res.status(500).json({ message: 'Failed to upload image' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const property = await propertyService.createProperty(req.user.userId, req.body);
    res.status(201).json(property);
  } catch (err) {
    console.error('Error creating property', err);
    res.status(400).json({ message: 'Failed to create property', error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const properties = await propertyService.listProperties(req.user.userId);
    res.json(properties);
  } catch (err) {
    console.error('Error listing properties', err);
    res.status(500).json({ message: 'Failed to list properties' });
  }
});

router.get('/tenant-feed', async (req, res) => {
  try {
    const properties = await propertyService.listTenantVisibleProperties();
    res.json(properties);
  } catch (err) {
    console.error('Error listing tenant feed properties', err);
    res.status(500).json({ message: 'Failed to list properties' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.user.userId, req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (err) {
    console.error('Error fetching property', err);
    res.status(400).json({ message: 'Failed to fetch property', error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await propertyService.updateProperty(req.user.userId, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Error updating property', err);
    res.status(400).json({ message: 'Failed to update property', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await propertyService.deleteProperty(req.user.userId, req.params.id);
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
