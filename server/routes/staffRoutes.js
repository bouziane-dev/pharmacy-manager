const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const resolvePharmacyFromSubdomain = require("../middleware/resolvePharmacyFromSubdomain");
const requirePharmacyAccess = require("../middleware/requirePharmacyAccess");
const simpleRateLimit = require("../middleware/simpleRateLimit");
const staffController = require("../controllers/staffController");

const router = express.Router();

router.use(resolvePharmacyFromSubdomain);
router.use(requireAuth);
router.use(requirePharmacyAccess(["owner"]));

router.get("/", staffController.listStaff);
router.post(
  "/",
  simpleRateLimit({ windowMs: 60_000, max: 60 }),
  staffController.addStaff
);
router.patch(
  "/:id/reset-pin",
  simpleRateLimit({ windowMs: 60_000, max: 50 }),
  staffController.resetStaffPin
);
router.patch("/:id/disable", staffController.disableStaff);

module.exports = router;
