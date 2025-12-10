const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const propertyService = require('../services/propertyService');

// Multer setup: store in memory, enforce 5MB max
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Upload single property image, compress and save to /uploads/properties
router.post('/upload-image', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'properties');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `property_${timestamp}.jpg`;
    const filePath = path.join(uploadsDir, filename);

    await sharp(req.file.buffer)
      .resize(1200, 1200, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toFile(filePath);

    const publicUrl = `/uploads/properties/${filename}`;
    return res.status(201).json({ url: publicUrl });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(413)
        .json({ message: 'Image size is larger than 5MB. Please choose a smaller file.' });
    }
    console.error('Error uploading image', err);
    return res.status(500).json({ message: 'Failed to upload image' });
  }
});

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
