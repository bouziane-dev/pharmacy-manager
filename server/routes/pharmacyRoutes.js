const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const resolvePharmacyFromSlug = require("../middleware/resolvePharmacyFromSlug");
const requirePharmacyAccess = require("../middleware/requirePharmacyAccess");
const pharmacyController = require("../controllers/pharmacyController");

const router = express.Router();

router.get(
  "/check-slug",
  requireAuth,
  pharmacyController.checkSlugAvailability
);
router.post("/create", requireAuth, pharmacyController.createPharmacy);

router.use(requireAuth);
router.use(resolvePharmacyFromSlug);
router.use(requirePharmacyAccess(["owner", "staff"]));

router.get("/prescribers", pharmacyController.listPrescribers);
router.post("/prescribers", pharmacyController.addPrescriber);

module.exports = router;
