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

  return function pharmacyAccessGuard(req, res, next) {
    const requestPharmacyId = String(req.pharmacyId || "");
    const userPharmacyId = String(req.user?.pharmacyId || "");
    const mappedRole = mapUserRoleForGuards(req.user);

    if (!req.user || !requestPharmacyId) {
      return res.status(401).json({ error: "Unauthorized pharmacy access" });
    }

    if (!userPharmacyId || userPharmacyId !== requestPharmacyId) {
      return res.status(403).json({ error: "No access to this pharmacy" });
    }

    if (req.user.isActive === false) {
      return res.status(403).json({ error: "User account is disabled" });
    }

    if (normalizedRoles.length > 0 && !normalizedRoles.includes(mappedRole)) {
      return res.status(403).json({ error: "Insufficient role for this action" });
    }

    req.membership = {
      userId: req.user._id,
      pharmacyId: requestPharmacyId,
      role: mappedRole,
    };

    return next();
  };
}

module.exports = requirePharmacyAccess;
