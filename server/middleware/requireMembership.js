const Membership = require("../models/Membership");
const { cleanString, isValidObjectId } = require("../utils/input");

function requireMembership(allowedRoles = []) {
  return async function membershipGuard(req, res, next) {
    try {
      const pharmacyId =
        req.pharmacyId ||
        req.params.pharmacyId ||
        req.body.pharmacyId ||
        req.query.pharmacyId;
      const normalizedPharmacyId = cleanString(pharmacyId);

      if (!normalizedPharmacyId || !isValidObjectId(normalizedPharmacyId)) {
        return res.status(400).json({ error: "Valid pharmacyId is required" });
      }

      if (
        req.user?.pharmacyId &&
        String(req.user.pharmacyId) === String(normalizedPharmacyId)
      ) {
        const normalizedRole = req.user.role === "owner" ? "owner" : "pharmacist";
        if (allowedRoles.length > 0 && !allowedRoles.includes(normalizedRole)) {
          return res.status(403).json({ error: "Insufficient membership role" });
        }

        req.membership = {
          userId: req.user._id,
          pharmacyId: normalizedPharmacyId,
          role: normalizedRole,
        };
        req.pharmacyId = normalizedPharmacyId;
        return next();
      }

      const membership = await Membership.findOne({
        userId: req.user._id,
        pharmacyId: normalizedPharmacyId,
      });

      if (!membership) {
        return res
          .status(403)
          .json({ error: "No pharmacy membership for this resource" });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        return res.status(403).json({ error: "Insufficient membership role" });
      }

      req.membership = membership;
      req.pharmacyId = normalizedPharmacyId;
      return next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
}

module.exports = requireMembership;
