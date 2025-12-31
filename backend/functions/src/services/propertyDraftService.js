const PropertyDraft = require('../models/PropertyDraft');
const Property = require('../models/Property');

function toSafeObject(payload) {
  return payload && typeof payload === 'object' ? payload : {};
}

async function createDraft(ownerId, payload) {
  const safePayload = toSafeObject(payload);
  const draft = new PropertyDraft({ ownerId, data: safePayload });
  return draft.save();
}

async function updateDraft(ownerId, id, payload) {
  const safePayload = toSafeObject(payload);
  return PropertyDraft.findOneAndUpdate(
    { _id: id, ownerId },
    { $set: { data: safePayload } },
    { new: true }
  );
}

async function getDraftById(ownerId, id) {
  return PropertyDraft.findOne({ _id: id, ownerId });
}

async function listDrafts(ownerId) {
  return PropertyDraft.find({ ownerId }).sort({ updatedAt: -1 });
}

async function deleteDraft(ownerId, id) {
  return PropertyDraft.findOneAndDelete({ _id: id, ownerId });
}

async function publishDraft(ownerId, id) {
  const draft = await PropertyDraft.findOne({ _id: id, ownerId });
  if (!draft) return null;

  const safeData = toSafeObject(draft.data);
  const property = new Property({
    ...safeData,
    ownerId,
    visibleForTenants:
      typeof safeData.visibleForTenants === 'boolean' ? safeData.visibleForTenants : true,
  });

  const saved = await property.save();
  await PropertyDraft.deleteOne({ _id: id, ownerId });
  return saved;
}

module.exports = {
  createDraft,
  updateDraft,
  getDraftById,
  listDrafts,
  deleteDraft,
  publishDraft,
};
