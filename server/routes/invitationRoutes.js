const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireMembership = require("../middleware/requireMembership");
const invitationController = require("../controllers/invitationController");

const router = express.Router();

router.post(
  "/invite",
  requireAuth,
  requireMembership(["owner"]),
  invitationController.createInvitation
);
router.get("/pending", requireAuth, invitationController.getPendingInvitations);
router.get(
  "/workspace",
  requireAuth,
  requireMembership(["owner", "admin"]),
  invitationController.getWorkspacePendingInvitations
);
router.post("/accept", requireAuth, invitationController.acceptInvitation);
router.post("/decline", requireAuth, invitationController.declineInvitation);

module.exports = router;
