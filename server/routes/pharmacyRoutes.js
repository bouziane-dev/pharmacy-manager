const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const pharmacyController = require("../controllers/pharmacyController");

const router = express.Router();

router.post("/create", requireAuth, pharmacyController.createPharmacy);

module.exports = router;
