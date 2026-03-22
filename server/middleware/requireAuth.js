const User = require("../models/User");
const { verifyAuthToken } = require("../services/authTokenService");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.userId).select("-__v");

    if (!user) {
      return res.status(401).json({ error: "User not found for token" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: "User account is disabled" });
    }

    if (req.pharmacyId) {
      const tokenPharmacyId = String(payload.pharmacyId || "");
      const userPharmacyId = String(user.pharmacyId || "");

      if (tokenPharmacyId && tokenPharmacyId !== String(req.pharmacyId)) {
        return res.status(403).json({ error: "Token pharmacy mismatch" });
      }
      if (!userPharmacyId || userPharmacyId !== String(req.pharmacyId)) {
        return res.status(403).json({ error: "User does not belong to this pharmacy" });
      }
    }

    req.auth = payload;
    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = requireAuth;
