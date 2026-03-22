const express = require("express");
const requireAuth = require("../../middleware/requireAuth");
const requireSuperAdmin = require("../../middleware/requireSuperAdmin");
const simpleRateLimit = require("../../middleware/simpleRateLimit");
const superadminController = require("../../controllers/superadminController");

const router = express.Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

router.get(
  "/pharmacies",
  simpleRateLimit({ windowMs: 60_000, max: 120 }),
  superadminController.listPharmacies
);
router.patch(
  "/pharmacies/:id/status",
  simpleRateLimit({ windowMs: 60_000, max: 80 }),
  superadminController.updatePharmacyStatus
);
router.get(
  "/users",
  simpleRateLimit({ windowMs: 60_000, max: 120 }),
  superadminController.listUsers
);
router.get(
  "/stats",
  simpleRateLimit({ windowMs: 60_000, max: 120 }),
  superadminController.getGlobalStats
);
router.get(
  "/activity-logs",
  simpleRateLimit({ windowMs: 60_000, max: 120 }),
  superadminController.listGlobalActivityLogs
);

module.exports = router;
