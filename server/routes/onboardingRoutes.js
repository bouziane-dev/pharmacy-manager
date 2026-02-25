const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const onboardingController = require("../controllers/onboardingController");

const router = express.Router();

router.post("/choose-role", requireAuth, onboardingController.chooseRole);

// Placeholder subscription endpoint for UI onboarding until billing is integrated.
router.post(
  "/activate-subscription",
  requireAuth,
  onboardingController.activateSubscription
);

module.exports = router;
