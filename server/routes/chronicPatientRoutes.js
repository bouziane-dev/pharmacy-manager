const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const resolvePharmacyFromSlug = require("../middleware/resolvePharmacyFromSlug");
const requirePharmacyAccess = require("../middleware/requirePharmacyAccess");
const chronicPatientController = require("../controllers/chronicPatientController");

const router = express.Router();

router.use(requireAuth);
router.use(resolvePharmacyFromSlug);
router.use(requirePharmacyAccess(["owner", "staff"]));

router.get("/", chronicPatientController.listPatients);
router.post("/", chronicPatientController.createPatient);
router.get("/:patientId", chronicPatientController.getPatient);
router.patch("/:patientId", chronicPatientController.updatePatient);
router.delete("/:patientId", chronicPatientController.deletePatient);
router.patch("/:patientId/archive", chronicPatientController.archivePatient);
router.post("/:patientId/contact", chronicPatientController.markContacted);
router.post("/:patientId/treatments", chronicPatientController.addTreatment);
router.patch("/:patientId/treatments/:treatmentId", chronicPatientController.updateTreatment);
router.delete("/:patientId/treatments/:treatmentId", chronicPatientController.deleteTreatment);
router.post(
  "/:patientId/treatments/:treatmentId/deliveries",
  chronicPatientController.recordDelivery,
);

module.exports = router;
