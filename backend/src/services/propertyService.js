const Property = require('../models/Property');

async function createProperty(payload) {
  const property = new Property(payload);
  return property.save();
}

async function updateProperty(id, payload) {
  const updated = await Property.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return updated;
}

async function getPropertyById(id) {
  return Property.findById(id);
}

async function listProperties() {
  return Property.find().sort({ createdAt: -1 });
}

module.exports = {
  createProperty,
  updateProperty,
  getPropertyById,
  listProperties,
};
