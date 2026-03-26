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

const ALLOWED_STAFF_ROLES = new Set(["pharmacist", "admin"]);

function normalizeStaffRole(value) {
  const normalized = cleanSingleLine(value).toLowerCase();
  if (!normalized) return null;
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

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function hasDuplicateStaffName(pharmacyId, staffName) {
  const exactNamePattern = new RegExp(`^${escapeRegex(staffName)}$`, "i");
  const existing = await User.findOne({
    pharmacyId,
    role: "staff",
    name: exactNamePattern,
  }).select("_id");
  return Boolean(existing);
}

async function hasDuplicateStaffPin(pharmacyId, pin, excludedStaffId = null) {
  const query = {
    pharmacyId,
    role: "staff",
    ...(excludedStaffId ? { _id: { $ne: excludedStaffId } } : {}),
  };
  const staffUsers = await User.find(query).select("name +pinHash");
  for (const item of staffUsers) {
    const matches = await comparePin(pin, item.pinHash);
    if (matches) return true;
  }
  return false;
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

async function resolveStaffByPin(req, res) {
  try {
    const pin = normalizePin(req.body.pin);
    if (!isValidPin(pin)) {
      return res.status(400).json({ error: "PIN must be between 2 and 6 digits" });
    }

    const staffUsers = await User.find({
      pharmacyId: req.pharmacyId,
      role: "staff",
      isActive: true,
    }).select("name displayName staffRole +pinHash");

    for (const item of staffUsers) {
      const matches = await comparePin(pin, item.pinHash);
      if (!matches) continue;

      return res.status(200).json({
        staff: {
          id: String(item._id),
          name: item.name || item.displayName || "Staff",
          role: item.staffRole || "staff",
        },
      });
    }

    return res.status(401).json({ error: "Invalid PIN" });
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
        .json({ error: "Invalid staff role. Use admin or pharmacist" });
    }

    const plainPin = requestedPin;
    if (!plainPin) {
      return res.status(400).json({ error: "PIN is required" });
    }
    if (!isValidPin(plainPin)) {
      return res.status(400).json({ error: "PIN must be between 2 and 6 digits" });
    }

    const nameInUse = await hasDuplicateStaffName(req.pharmacyId, normalizedName);
    if (nameInUse) {
      return res.status(409).json({
        error: "A staff member with this name already exists in this pharmacy",
      });
    }

    const pinInUse = await hasDuplicateStaffPin(req.pharmacyId, plainPin);
    if (pinInUse) {
      return res.status(409).json({
        error: "This PIN is already used by another staff member in this pharmacy",
      });
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
      return res.status(400).json({ error: "PIN must be between 2 and 6 digits" });
    }

    const currentPinMatches = requestedPin
      ? await comparePin(nextPin, staffUser.pinHash)
      : false;
    if (currentPinMatches) {
      return res
        .status(400)
        .json({ error: "New PIN must be different from the current PIN" });
    }

    const pinInUse = await hasDuplicateStaffPin(req.pharmacyId, nextPin, staffUser._id);
    if (pinInUse) {
      return res.status(409).json({
        error: "This PIN is already used by another staff member in this pharmacy",
      });
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
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updateStaffRole(req, res) {
  try {
    const staffId = cleanString(req.params.id);
    if (!staffId || !isValidObjectId(staffId)) {
      return res.status(400).json({ error: "Valid staff id is required" });
    }

    const nextRole = normalizeStaffRole(req.body.role);
    if (!nextRole) {
      return res
        .status(400)
        .json({ error: "Invalid staff role. Use admin or pharmacist" });
    }

    const staffUser = await User.findOne({
      _id: staffId,
      pharmacyId: req.pharmacyId,
      role: "staff",
    });

    if (!staffUser) {
      return res.status(404).json({ error: "Staff user not found" });
    }

    const previousRole = staffUser.staffRole || "staff";
    if (previousRole === nextRole) {
      return res.status(200).json({
        message: "Staff role is already set",
        staff: mapStaffUser(staffUser),
      });
    }

    staffUser.staffRole = nextRole;
    await staffUser.save();

    await logActivity({
      action: "UPDATE_STAFF_ROLE",
      description: `Updated role for ${staffUser.name} to ${nextRole}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        staffUserId: String(staffUser._id),
        previousRole,
        nextRole,
      },
    });

    return res.status(200).json({
      message: "Staff role updated successfully",
      staff: mapStaffUser(staffUser),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function deleteStaff(req, res) {
  try {
    const staffId = cleanString(req.params.id);
    if (!staffId || !isValidObjectId(staffId)) {
      return res.status(400).json({ error: "Valid staff id is required" });
    }

    const staffUser = await User.findOneAndDelete({
      _id: staffId,
      pharmacyId: req.pharmacyId,
      role: "staff",
    });

    if (!staffUser) {
      return res.status(404).json({ error: "Staff user not found" });
    }

    await logActivity({
      action: "DELETE_STAFF",
      description: `Deleted staff account ${staffUser.name}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        staffUserId: String(staffUser._id),
      },
    });

    return res.status(200).json({
      message: "Staff user deleted successfully",
      staffId: String(staffUser._id),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listStaff,
  resolveStaffByPin,
  addStaff,
  resetStaffPin,
  updateStaffRole,
  deleteStaff,
};
