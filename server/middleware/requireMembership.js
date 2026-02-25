const mongoose = require("mongoose");
const Membership = require("../models/Membership");

function requireMembership(allowedRoles = []) {
  return async function membershipGuard(req, res, next) {
    try {
      const pharmacyId =
        req.params.pharmacyId || req.body.pharmacyId || req.query.pharmacyId;

      if (!pharmacyId || !mongoose.Types.ObjectId.isValid(pharmacyId)) {
        return res.status(400).json({ error: "Valid pharmacyId is required" });
      }

      const membership = await Membership.findOne({
        userId: req.user._id,
        pharmacyId,
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
      req.pharmacyId = pharmacyId;
      next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
}

module.exports = requireMembership;
