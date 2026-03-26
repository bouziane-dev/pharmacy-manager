const Membership = require("../models/Membership");

function normalizeAllowedRoles(roles) {
  return Array.isArray(roles) ? roles : [];
}

function mapUserRoleForGuards(user) {
  if (!user) return null;
  if (user.role === "owner") return "owner";
  return "staff";
}

function requirePharmacyAccess(allowedRoles = []) {
  const normalizedRoles = normalizeAllowedRoles(allowedRoles);

  return async function pharmacyAccessGuard(req, res, next) {
    const requestPharmacyId = String(req.pharmacyId || "");
    const userPharmacyId = String(req.user?.pharmacyId || "");
    let mappedRole = mapUserRoleForGuards(req.user);

    if (!req.user || !requestPharmacyId) {
      return res.status(401).json({ error: "Unauthorized pharmacy access" });
    }

    if (req.user.isActive === false) {
      return res.status(403).json({ error: "User account is disabled" });
    }

    const hasDirectPharmacyAccess =
      Boolean(userPharmacyId) && userPharmacyId === requestPharmacyId;

    if (!hasDirectPharmacyAccess) {
      const membership = await Membership.findOne({
        userId: req.user._id,
        pharmacyId: requestPharmacyId,
      }).select("userId pharmacyId role");

      if (!membership) {
        return res.status(403).json({ error: "No access to this pharmacy" });
      }

      mappedRole = membership.role === "owner" ? "owner" : "staff";
      req.membership = {
        userId: req.user._id,
        pharmacyId: requestPharmacyId,
        role: mappedRole,
      };
    }

    if (normalizedRoles.length > 0 && !normalizedRoles.includes(mappedRole)) {
      return res.status(403).json({ error: "Insufficient role for this action" });
    }

    if (!req.membership) {
      req.membership = {
        userId: req.user._id,
        pharmacyId: requestPharmacyId,
        role: mappedRole,
      };
    }

    return next();
  };
}

module.exports = requirePharmacyAccess;
