const Invitation = require("../models/Invitation");
const Membership = require("../models/Membership");
const {
  cleanEmail,
  cleanString,
  isValidEmail,
  isValidObjectId,
  normalizeRole,
} = require("../utils/input");

async function createInvitation(req, res) {
  try {
    const { pharmacyId, email, role } = req.body;
    const normalizedPharmacyId = cleanString(pharmacyId);
    const normalizedEmail = cleanEmail(email);
    const normalizedRole = normalizeRole(role);

    if (!normalizedPharmacyId || !isValidObjectId(normalizedPharmacyId)) {
      return res.status(400).json({ error: "Valid pharmacyId is required" });
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: "Invitee email is required" });
    }

    if (!["pharmacist", "admin"].includes(normalizedRole)) {
      return res
        .status(400)
        .json({ error: "Invalid invitation role. Use pharmacist or admin" });
    }

    if (!req.membership || req.membership.role !== "owner") {
      return res
        .status(403)
        .json({ error: "Only pharmacy owners can send invitations" });
    }

    const existingPending = await Invitation.findOne({
      pharmacyId: normalizedPharmacyId,
      email: normalizedEmail,
      status: "pending",
    });

    if (existingPending) {
      return res.status(409).json({ error: "Pending invitation already exists" });
    }

    const invitation = await Invitation.create({
      pharmacyId: normalizedPharmacyId,
      email: normalizedEmail,
      role: normalizedRole,
      invitedByUserId: req.user._id,
      status: "pending",
    });

    return res.status(201).json({
      message: "Invitation created successfully",
      invitation,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getPendingInvitations(req, res) {
  try {
    const invitations = await Invitation.find({
      email: req.user.email.toLowerCase(),
      status: "pending",
    })
      .populate("pharmacyId", "name subscriptionStatus")
      .populate("invitedByUserId", "displayName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ invitations });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getWorkspacePendingInvitations(req, res) {
  try {
    const invitations = await Invitation.find({
      pharmacyId: req.pharmacyId,
      status: "pending",
    })
      .populate("invitedByUserId", "displayName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ invitations });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function acceptInvitation(req, res) {
  try {
    const { invitationId } = req.body;
    const normalizedInvitationId = cleanString(invitationId);

    if (!normalizedInvitationId || !isValidObjectId(normalizedInvitationId)) {
      return res.status(400).json({ error: "Valid invitationId is required" });
    }

    const invitation = await Invitation.findOne({
      _id: normalizedInvitationId,
      email: req.user.email.toLowerCase(),
      status: "pending",
    });

    if (!invitation) {
      return res.status(404).json({ error: "Pending invitation not found" });
    }

    const existingMembership = await Membership.findOne({
      userId: req.user._id,
      pharmacyId: invitation.pharmacyId,
    });

    if (!existingMembership) {
      await Membership.create({
        userId: req.user._id,
        pharmacyId: invitation.pharmacyId,
        role: invitation.role,
      });
    }

    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    await invitation.save();

    return res.status(200).json({
      message: "Invitation accepted",
      membership: {
        userId: req.user._id,
        pharmacyId: invitation.pharmacyId,
        role: invitation.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function declineInvitation(req, res) {
  try {
    const { invitationId } = req.body;
    const normalizedInvitationId = cleanString(invitationId);

    if (!normalizedInvitationId || !isValidObjectId(normalizedInvitationId)) {
      return res.status(400).json({ error: "Valid invitationId is required" });
    }

    const invitation = await Invitation.findOne({
      _id: normalizedInvitationId,
      email: req.user.email.toLowerCase(),
      status: "pending",
    });

    if (!invitation) {
      return res.status(404).json({ error: "Pending invitation not found" });
    }

    invitation.status = "declined";
    await invitation.save();

    return res.status(200).json({
      message: "Invitation declined",
      invitation: {
        id: invitation._id,
        status: invitation.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createInvitation,
  getPendingInvitations,
  getWorkspacePendingInvitations,
  acceptInvitation,
  declineInvitation,
};
