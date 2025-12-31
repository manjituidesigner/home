const Property = require('../models/Property');

async function createProperty(ownerId, payload) {
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const property = new Property({
    ...safePayload,
    ownerId,
    visibleForTenants:
      typeof safePayload.visibleForTenants === 'boolean' ? safePayload.visibleForTenants : true,
  });
  return property.save();
}

async function updateProperty(ownerId, id, payload) {
  const updated = await Property.findOneAndUpdate({ _id: id, ownerId }, payload, {
    new: true,
    runValidators: true,
  });
  return updated;
}

async function getPropertyById(ownerId, id) {
  return Property.findOne({ _id: id, ownerId });
}

async function listProperties(ownerId) {
  return Property.find({ ownerId }).sort({ createdAt: -1 });
}

async function listTenantVisibleProperties() {
  return Property.find({ status: 'available', visibleForTenants: true }).sort({ createdAt: -1 });
}

async function deleteProperty(ownerId, id) {
  return Property.findOneAndDelete({ _id: id, ownerId });
}

module.exports = {
  createProperty,
  updateProperty,
  getPropertyById,
  listProperties,
  listTenantVisibleProperties,
  deleteProperty,
};
