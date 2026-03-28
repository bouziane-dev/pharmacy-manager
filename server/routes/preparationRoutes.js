const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const resolvePharmacyFromSlug = require("../middleware/resolvePharmacyFromSlug");
const requirePharmacyAccess = require("../middleware/requirePharmacyAccess");
const preparationController = require("../controllers/preparationController");

const router = express.Router();

router.use(requireAuth);
router.use(resolvePharmacyFromSlug);
router.use(requirePharmacyAccess(["owner", "staff"]));

router.get("/", preparationController.listPreparations);
router.post("/", preparationController.createPreparation);
router.patch("/:preparationId", preparationController.updatePreparation);
router.delete("/:preparationId", preparationController.deletePreparation);

module.exports = router;
