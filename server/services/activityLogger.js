const ActivityLog = require("../models/ActivityLog");
const { cleanSingleLine, cleanString } = require("../utils/input");

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata;
}

async function logActivity({ action, description = "", userId, pharmacyId, metadata = {} }) {
  const normalizedAction = cleanSingleLine(action);
  const normalizedDescription = cleanString(description);

  if (!normalizedAction || !userId || !pharmacyId) {
    return null;
  }

  try {
    return await ActivityLog.create({
      action: normalizedAction,
      description: normalizedDescription || "",
      userId,
      pharmacyId,
      metadata: normalizeMetadata(metadata),
    });
  } catch (error) {
    // Logging should not block primary business actions.
    console.error("[activity] failed to write log:", error.message);
    return null;
  }
}

module.exports = {
  logActivity,
};
