const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const sessionController = require("../controllers/sessionController");

const router = express.Router();

router.get("/bootstrap", requireAuth, sessionController.getBootstrapSession);

module.exports = router;
