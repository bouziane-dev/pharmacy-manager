const { logActivity } = require("./activityLogger");

async function writeActivityLog({ action, details = "", userId, pharmacyId, metadata = {} }) {
  return logActivity({
    action,
    description: details,
    userId,
    pharmacyId,
    metadata,
  });
}

module.exports = {
  writeActivityLog,
  logActivity,
};
