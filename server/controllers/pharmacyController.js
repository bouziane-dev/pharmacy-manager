const Pharmacy = require("../models/Pharmacy");
const Membership = require("../models/Membership");
const User = require("../models/User");
const { cleanSingleLine } = require("../utils/input");
const { logActivity } = require("../services/activityLogger");

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

function normalizeSubdomain(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

async function createPharmacy(req, res) {
  try {
    const { name, subdomain } = req.body;
    const normalizedName = cleanSingleLine(name);
    const normalizedSubdomain = normalizeSubdomain(subdomain);

    if (!normalizedName) {
      return res.status(400).json({ error: "Pharmacy name is required" });
    }

    if (!normalizedSubdomain || !SUBDOMAIN_PATTERN.test(normalizedSubdomain)) {
      return res.status(400).json({
        error:
          "Subdomain is required and must contain only lowercase letters, digits, and hyphens",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isOwner = user.role === "owner" || user.primaryRole === "owner";
    if (!isOwner) {
      return res
        .status(403)
        .json({ error: "Only owners can create a pharmacy workspace" });
    }

    // Billing plans are not enabled yet. Treat owner setup as subscription-active.
    if (!user.subscriptionActive) {
      user.subscriptionActive = true;
    }

    if (user.pharmacyId) {
      return res.status(409).json({ error: "This owner already has a pharmacy" });
    }

    const existingSubdomain = await Pharmacy.findOne({
      subdomain: normalizedSubdomain,
    }).select("_id");
    if (existingSubdomain) {
      return res.status(409).json({ error: "Subdomain is already taken" });
    }

    const pharmacy = await Pharmacy.create({
      name: normalizedName,
      subdomain: normalizedSubdomain,
      ownerId: user._id,
      ownerUserId: user._id,
      subscriptionStatus: "active",
      isActive: true,
    });

    await Membership.findOneAndUpdate(
      { userId: user._id, pharmacyId: pharmacy._id },
      {
        userId: user._id,
        pharmacyId: pharmacy._id,
        role: "owner",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    user.pharmacyId = pharmacy._id;
    user.role = "owner";
    user.primaryRole = "owner";
    user.onboardingCompleted = true;
    await user.save();

    await logActivity({
      action: "CREATE_PHARMACY",
      description: `Created pharmacy ${pharmacy.name} (${pharmacy.subdomain})`,
      userId: user._id,
      pharmacyId: pharmacy._id,
      metadata: {
        pharmacyId: String(pharmacy._id),
        subdomain: pharmacy.subdomain,
      },
    });

    return res.status(201).json({
      message: "Pharmacy created successfully",
      pharmacy,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function checkSubdomainAvailability(req, res) {
  try {
    const normalizedSubdomain = normalizeSubdomain(req.query.subdomain);

    if (!normalizedSubdomain || !SUBDOMAIN_PATTERN.test(normalizedSubdomain)) {
      return res.status(400).json({
        error:
          "Subdomain is required and must contain only lowercase letters, digits, and hyphens",
      });
    }

    const existingSubdomain = await Pharmacy.findOne({
      subdomain: normalizedSubdomain,
    }).select("_id");

    return res.status(200).json({
      subdomain: normalizedSubdomain,
      available: !existingSubdomain,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createPharmacy,
  checkSubdomainAvailability,
};
