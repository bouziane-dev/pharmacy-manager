const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const resolvePharmacyFromSlug = require("../middleware/resolvePharmacyFromSlug");
const requirePharmacyAccess = require("../middleware/requirePharmacyAccess");
const inBodyController = require("../controllers/inBodyController");

const router = express.Router();

router.use(requireAuth);
router.use(resolvePharmacyFromSlug);
router.use(requirePharmacyAccess(["owner", "staff"]));

router.get("/overview", inBodyController.getOverviewStats);
router.get("/settings", inBodyController.getSettings);
router.patch("/settings", inBodyController.updateSettings);
router.post("/settings/packs", inBodyController.saveSubscriptionPack);
router.delete("/settings/packs/:packId", inBodyController.deleteSubscriptionPack);
router.get("/patients", inBodyController.listPatients);
router.post("/patients", inBodyController.createPatient);
router.get("/patients/:patientId", inBodyController.getPatientProfile);
router.patch("/patients/:patientId/subscription", inBodyController.updatePatientSubscription);
router.delete("/patients/:patientId", inBodyController.deletePatient);
router.get("/patients/:patientId/tests", inBodyController.listPatientTests);
router.post("/patients/:patientId/tests", inBodyController.createPatientTest);
router.delete("/patients/:patientId/tests/:testId", inBodyController.deletePatientTest);

module.exports = router;
