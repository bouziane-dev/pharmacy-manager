const express = require("express");
const ActivityLog = require("../models/ActivityLog");
const resolvePharmacyFromSlug = require("../middleware/resolvePharmacyFromSlug");
const requireAuth = require("../middleware/requireAuth");
const requirePharmacyAccess = require("../middleware/requirePharmacyAccess");
const simpleRateLimit = require("../middleware/simpleRateLimit");
const { cleanSingleLine, cleanString, isValidObjectId } = require("../utils/input");

const router = express.Router();
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

function requireOwnerOrAdmin(req, res, next) {
  const isOwner = req.user?.role === "owner";
  const isAdminStaff =
    req.user?.role === "staff" &&
    cleanSingleLine(req.user?.staffRole || "").toLowerCase() === "admin";

  if (!isOwner && !isAdminStaff) {
    return res.status(403).json({ error: "Only owner or admin can access activity logs" });
  }

  return next();
}

router.use(requireAuth);
router.use(resolvePharmacyFromSlug);
router.use(requirePharmacyAccess(["owner", "staff"]));
router.use(requireOwnerOrAdmin);

router.get(
  "/",
  simpleRateLimit({ windowMs: 60_000, max: 120 }),
  async (req, res) => {
    try {
      const page = parsePositiveInteger(req.query.page, 1, { min: 1, max: 10_000 });
      const limit = parsePositiveInteger(req.query.limit, 20, { min: 1, max: 100 });
      const skip = (page - 1) * limit;

      const query = { pharmacyId: req.pharmacyId };
      query.action = { $not: /^SUPERADMIN_/ };

      const userId = cleanString(req.query.userId);
      if (userId) {
        if (!isValidObjectId(userId)) {
          return res.status(400).json({ error: "Invalid userId filter" });
        }
        query.userId = userId;
      }

      const action = cleanSingleLine(req.query.action);
      if (action) {
        if (action.toUpperCase().startsWith("SUPERADMIN_")) {
          return res.status(400).json({ error: "Invalid action filter" });
        }
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

      const [items, total] = await Promise.all([
        ActivityLog.find(query)
          .populate("userId", "name displayName email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        ActivityLog.countDocuments(query),
      ]);

      const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

      return res.status(200).json({
        logs: items.map((item) => ({
          _id: String(item._id),
          action: item.action,
          description: item.description || "",
          user: {
            name:
              item.userId?.name ||
              item.userId?.displayName ||
              item.userId?.email ||
              "Unknown",
          },
          createdAt: item.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
