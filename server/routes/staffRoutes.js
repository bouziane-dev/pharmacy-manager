const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const resolvePharmacyFromSubdomain = require("../middleware/resolvePharmacyFromSubdomain");
const requirePharmacyAccess = require("../middleware/requirePharmacyAccess");
const simpleRateLimit = require("../middleware/simpleRateLimit");
const staffController = require("../controllers/staffController");

const router = express.Router();

function requireOwnerOrAdmin(req, res, next) {
  const isOwner = req.user?.role === "owner";
  const isAdminStaff =
    req.user?.role === "staff" &&
    String(req.user?.staffRole || "").toLowerCase() === "admin";

  if (!isOwner && !isAdminStaff) {
    return res.status(403).json({ error: "Only owner or admin can perform this action" });
  }

  return next();
}

router.use(requireAuth);
router.use(resolvePharmacyFromSubdomain);

router.get("/", requirePharmacyAccess(["owner"]), staffController.listStaff);
router.post(
  "/resolve-pin",
  requirePharmacyAccess(["owner", "staff"]),
  staffController.resolveStaffByPin
);
router.post(
  "/",
  requirePharmacyAccess(["owner"]),
  simpleRateLimit({ windowMs: 60_000, max: 60 }),
  staffController.addStaff
);
router.patch(
  "/:id/role",
  requirePharmacyAccess(["owner"]),
  simpleRateLimit({ windowMs: 60_000, max: 80 }),
  staffController.updateStaffRole
);
router.patch(
  "/:id/reset-pin",
  requirePharmacyAccess(["owner", "staff"]),
  requireOwnerOrAdmin,
  simpleRateLimit({ windowMs: 60_000, max: 50 }),
  staffController.resetStaffPin
);
router.delete(
  "/:id",
  requirePharmacyAccess(["owner", "staff"]),
  requireOwnerOrAdmin,
  staffController.deleteStaff
);

module.exports = router;
