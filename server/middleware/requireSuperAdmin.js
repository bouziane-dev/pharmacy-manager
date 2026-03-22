function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Superadmin access is required" });
  }

  if (req.user.isActive === false) {
    return res.status(403).json({ error: "User account is disabled" });
  }

  return next();
}

module.exports = requireSuperAdmin;
