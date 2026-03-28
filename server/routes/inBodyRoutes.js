const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const resolvePharmacyFromSlug = require("../middleware/resolvePharmacyFromSlug");
const requirePharmacyAccess = require("../middleware/requirePharmacyAccess");
const inBodyController = require("../controllers/inBodyController");

const router = express.Router();

router.use(requireAuth);
router.use(resolvePharmacyFromSlug);
router.use(requirePharmacyAccess(["owner", "staff"]));

router.get("/patients", inBodyController.listPatients);
router.post("/patients", inBodyController.createPatient);
router.get("/patients/:patientId/tests", inBodyController.listPatientTests);
router.post("/patients/:patientId/tests", inBodyController.createPatientTest);

module.exports = router;
