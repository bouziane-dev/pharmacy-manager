const User = require("../models/User");
const { logActivity } = require("../services/activityLogger");
const {
  cleanSingleLine,
  cleanString,
  isValidObjectId,
} = require("../utils/input");
const {
  comparePin,
  generatePin,
  hashPin,
  isValidPin,
  normalizePin,
} = require("../services/pinService");

const ALLOWED_STAFF_ROLES = new Set(["staff", "pharmacist", "admin", "assistant"]);

function normalizeStaffRole(value) {
  const normalized = cleanSingleLine(value).toLowerCase();
  if (!normalized) return "staff";
  return ALLOWED_STAFF_ROLES.has(normalized) ? normalized : null;
}

function mapStaffUser(user) {
  return {
    id: String(user._id),
    name: user.name || user.displayName || "",
    role: user.staffRole || "staff",
    accountRole: user.role,
    pharmacyId: String(user.pharmacyId),
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function listStaff(req, res) {
  try {
    const staffUsers = await User.find({
      pharmacyId: req.pharmacyId,
      role: "staff",
    })
      .select("name displayName role staffRole pharmacyId isActive createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      staff: staffUsers.map(mapStaffUser),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function addStaff(req, res) {
  try {
    const normalizedName = cleanSingleLine(req.body.name);
    const normalizedStaffRole = normalizeStaffRole(req.body.role);
    const requestedPin = normalizePin(req.body.pin);

    if (!normalizedName) {
      return res.status(400).json({ error: "Staff name is required" });
    }

    if (!normalizedStaffRole) {
      return res
        .status(400)
        .json({ error: "Invalid staff role. Use staff, pharmacist, admin, or assistant" });
    }

    let plainPin = requestedPin;
    if (!plainPin) {
      plainPin = generatePin();
    }
    if (!isValidPin(plainPin)) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    }

    const pinHash = await hashPin(plainPin);

    const staffUser = await User.create({
      name: normalizedName,
      displayName: normalizedName,
      role: "staff",
      staffRole: normalizedStaffRole,
      pharmacyId: req.pharmacyId,
      pinHash,
      isActive: true,
      onboardingCompleted: true,
      primaryRole: "pharmacist",
    });

    await logActivity({
      action: "CREATE_STAFF",
      description: `Created staff user ${normalizedName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        staffUserId: String(staffUser._id),
        staffRole: normalizedStaffRole,
      },
    });

    return res.status(201).json({
      message: "Staff user created successfully",
      staff: mapStaffUser(staffUser),
      pin: plainPin,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function resetStaffPin(req, res) {
  try {
    const staffId = cleanString(req.params.id);
    if (!staffId || !isValidObjectId(staffId)) {
      return res.status(400).json({ error: "Valid staff id is required" });
    }

    const staffUser = await User.findOne({
      _id: staffId,
      pharmacyId: req.pharmacyId,
      role: "staff",
    }).select("+pinHash");

    if (!staffUser) {
      return res.status(404).json({ error: "Staff user not found" });
    }

    const requestedPin = normalizePin(req.body.pin);
    const nextPin = requestedPin || generatePin();
    if (!isValidPin(nextPin)) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    }

    const currentPinMatches = requestedPin
      ? await comparePin(nextPin, staffUser.pinHash)
      : false;
    if (currentPinMatches) {
      return res
        .status(400)
        .json({ error: "New PIN must be different from the current PIN" });
    }

    staffUser.pinHash = await hashPin(nextPin);
    staffUser.isActive = true;
    await staffUser.save();

    await logActivity({
      action: "RESET_STAFF_PIN",
      description: `Reset PIN for ${staffUser.name}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        staffUserId: String(staffUser._id),
      },
    });

    return res.status(200).json({
      message: "Staff PIN reset successfully",
      staff: mapStaffUser(staffUser),
      pin: nextPin,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function disableStaff(req, res) {
  try {
    const staffId = cleanString(req.params.id);
    if (!staffId || !isValidObjectId(staffId)) {
      return res.status(400).json({ error: "Valid staff id is required" });
    }

    const staffUser = await User.findOne({
      _id: staffId,
      pharmacyId: req.pharmacyId,
      role: "staff",
    });

    if (!staffUser) {
      return res.status(404).json({ error: "Staff user not found" });
    }

    staffUser.isActive = false;
    await staffUser.save();

    await logActivity({
      action: "DISABLE_STAFF",
      description: `Disabled staff account ${staffUser.name}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        staffUserId: String(staffUser._id),
      },
    });

    return res.status(200).json({
      message: "Staff user disabled successfully",
      staff: mapStaffUser(staffUser),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listStaff,
  addStaff,
  resetStaffPin,
  disableStaff,
};
