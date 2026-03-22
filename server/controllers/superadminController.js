const ActivityLog = require("../models/ActivityLog");
const Order = require("../models/Order");
const Pharmacy = require("../models/Pharmacy");
const User = require("../models/User");
const { logActivity } = require("../services/activityLogger");
const { cleanSingleLine, cleanString, isValidObjectId } = require("../utils/input");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parsePositiveInteger(value, fallback, { min = 1, max = 100 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function parseDate(value, mode) {
  const normalized = cleanString(value);
  if (!normalized) return null;
  if (!DATE_PATTERN.test(normalized)) return null;

  const suffix = mode === "end" ? "T23:59:59.999Z" : "T00:00:00.000Z";
  const parsed = new Date(`${normalized}${suffix}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function normalizeSortOrder(value) {
  const normalized = cleanSingleLine(value).toLowerCase();
  return normalized === "asc" ? 1 : -1;
}

function buildPagination(page, limit, total) {
  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapUserRoleForDisplay(userDoc) {
  if (userDoc.role !== "staff") {
    return userDoc.role;
  }
  return userDoc.staffRole || "staff";
}

function buildRoleFilter(roleValue) {
  const normalized = cleanSingleLine(roleValue).toLowerCase();
  if (!normalized) return {};

  if (["superadmin", "owner", "staff"].includes(normalized)) {
    return { role: normalized };
  }

  if (["admin", "pharmacist", "assistant"].includes(normalized)) {
    return { role: "staff", staffRole: normalized };
  }

  return null;
}

async function listPharmacies(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1, { min: 1, max: 10_000 });
    const limit = parsePositiveInteger(req.query.limit, 20, { min: 1, max: 100 });
    const skip = (page - 1) * limit;
    const sortOrder = normalizeSortOrder(req.query.sort);
    const searchTerm = cleanString(req.query.search);

    const query = {};
    if (searchTerm) {
      const regex = new RegExp(escapeRegex(searchTerm), "i");
      query.$or = [{ name: regex }, { subdomain: regex }];
    }

    const [pharmacies, total] = await Promise.all([
      Pharmacy.find(query)
        .populate("ownerId", "name displayName email")
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit),
      Pharmacy.countDocuments(query),
    ]);

    return res.status(200).json({
      pharmacies: pharmacies.map((item) => ({
        id: String(item._id),
        name: item.name,
        subdomain: item.subdomain,
        isActive: item.isActive !== false,
        createdAt: item.createdAt,
        owner: {
          id: item.ownerId?._id ? String(item.ownerId._id) : String(item.ownerId || ""),
          name:
            item.ownerId?.name ||
            item.ownerId?.displayName ||
            item.ownerId?.email ||
            "Unknown",
          email: item.ownerId?.email || "",
        },
      })),
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updatePharmacyStatus(req, res) {
  try {
    const pharmacyId = cleanString(req.params.id);
    if (!pharmacyId || !isValidObjectId(pharmacyId)) {
      return res.status(400).json({ error: "Valid pharmacy id is required" });
    }

    const hasBooleanStatus = typeof req.body?.isActive === "boolean";
    const statusValue = cleanSingleLine(req.body?.status).toLowerCase();
    let nextIsActive = null;

    if (hasBooleanStatus) {
      nextIsActive = Boolean(req.body.isActive);
    } else if (["active", "enabled", "enable"].includes(statusValue)) {
      nextIsActive = true;
    } else if (["inactive", "disabled", "disable"].includes(statusValue)) {
      nextIsActive = false;
    }

    if (nextIsActive === null) {
      return res.status(400).json({
        error: "Provide isActive (boolean) or status (active/inactive)",
      });
    }

    const pharmacy = await Pharmacy.findByIdAndUpdate(
      pharmacyId,
      { isActive: nextIsActive },
      { new: true }
    ).populate("ownerId", "name displayName email");

    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }

    await logActivity({
      action: "SUPERADMIN_UPDATE_PHARMACY_STATUS",
      description: `Superadmin changed pharmacy ${pharmacy.name} status to ${
        nextIsActive ? "active" : "inactive"
      }`,
      userId: req.user._id,
      pharmacyId: pharmacy._id,
      metadata: {
        targetPharmacyId: String(pharmacy._id),
        isActive: nextIsActive,
      },
    });

    return res.status(200).json({
      message: "Pharmacy status updated successfully",
      pharmacy: {
        id: String(pharmacy._id),
        name: pharmacy.name,
        subdomain: pharmacy.subdomain,
        isActive: pharmacy.isActive !== false,
        createdAt: pharmacy.createdAt,
        owner: {
          id: pharmacy.ownerId?._id
            ? String(pharmacy.ownerId._id)
            : String(pharmacy.ownerId || ""),
          name:
            pharmacy.ownerId?.name ||
            pharmacy.ownerId?.displayName ||
            pharmacy.ownerId?.email ||
            "Unknown",
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function listUsers(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1, { min: 1, max: 10_000 });
    const limit = parsePositiveInteger(req.query.limit, 20, { min: 1, max: 100 });
    const skip = (page - 1) * limit;
    const searchTerm = cleanString(req.query.search);
    const pharmacyId = cleanString(req.query.pharmacyId);
    const roleFilter = buildRoleFilter(req.query.role);

    if (req.query.role && roleFilter === null) {
      return res.status(400).json({ error: "Invalid role filter" });
    }

    const query = {
      ...(roleFilter || {}),
    };

    if (pharmacyId) {
      if (!isValidObjectId(pharmacyId)) {
        return res.status(400).json({ error: "Invalid pharmacyId filter" });
      }
      query.pharmacyId = pharmacyId;
    }

    if (searchTerm) {
      const regex = new RegExp(escapeRegex(searchTerm), "i");
      query.$or = [{ name: regex }, { displayName: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .populate("pharmacyId", "name subdomain")
        .select(
          "name displayName email role staffRole pharmacyId isActive createdAt onboardingCompleted primaryRole"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      users: users.map((item) => ({
        id: String(item._id),
        name: item.name || item.displayName || item.email || "Unknown",
        email: item.email || "",
        role: mapUserRoleForDisplay(item),
        accountRole: item.role,
        isActive: item.isActive !== false,
        pharmacy: item.pharmacyId
          ? {
              id: String(item.pharmacyId._id),
              name: item.pharmacyId.name,
              subdomain: item.pharmacyId.subdomain,
            }
          : null,
        createdAt: item.createdAt,
      })),
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getGlobalStats(req, res) {
  try {
    const [totalPharmacies, totalUsers, totalOrders, activePharmacies] =
      await Promise.all([
        Pharmacy.countDocuments({}),
        User.countDocuments({}),
        Order.countDocuments({}),
        Pharmacy.countDocuments({ isActive: true }),
      ]);

    return res.status(200).json({
      totalPharmacies,
      totalUsers,
      totalOrders,
      activePharmacies,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function listGlobalActivityLogs(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1, { min: 1, max: 10_000 });
    const limit = parsePositiveInteger(req.query.limit, 20, { min: 1, max: 100 });
    const skip = (page - 1) * limit;

    const query = {};

    const pharmacyId = cleanString(req.query.pharmacyId);
    if (pharmacyId) {
      if (!isValidObjectId(pharmacyId)) {
        return res.status(400).json({ error: "Invalid pharmacyId filter" });
      }
      query.pharmacyId = pharmacyId;
    }

    const userId = cleanString(req.query.userId);
    if (userId) {
      if (!isValidObjectId(userId)) {
        return res.status(400).json({ error: "Invalid userId filter" });
      }
      query.userId = userId;
    }

    const action = cleanSingleLine(req.query.action);
    if (action) {
      query.action = action;
    }

    const from = parseDate(req.query.from, "start");
    const to = parseDate(req.query.to, "end");
    if ((req.query.from && !from) || (req.query.to && !to)) {
      return res.status(400).json({ error: "Date filters must use YYYY-MM-DD" });
    }
    if (from && to && from.getTime() > to.getTime()) {
      return res.status(400).json({ error: "from date must be before or equal to to date" });
    }
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = from;
      if (to) query.createdAt.$lte = to;
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate("userId", "name displayName email")
        .populate("pharmacyId", "name subdomain")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(query),
    ]);

    return res.status(200).json({
      logs: logs.map((item) => ({
        _id: String(item._id),
        action: item.action,
        description: item.description || "",
        user: {
          id: item.userId?._id ? String(item.userId._id) : null,
          name:
            item.userId?.name ||
            item.userId?.displayName ||
            item.userId?.email ||
            "Unknown",
        },
        pharmacy: {
          id: item.pharmacyId?._id ? String(item.pharmacyId._id) : null,
          name: item.pharmacyId?.name || "Unknown",
          subdomain: item.pharmacyId?.subdomain || "",
        },
        createdAt: item.createdAt,
      })),
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listPharmacies,
  updatePharmacyStatus,
  listUsers,
  getGlobalStats,
  listGlobalActivityLogs,
};
