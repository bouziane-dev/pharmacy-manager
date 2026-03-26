const Pharmacy = require("../models/Pharmacy");
const { cleanString, isValidObjectId } = require("../utils/input");

const RESERVED_SUBDOMAINS = new Set(["www", "api", "localhost"]);

function stripPort(hostHeader) {
  return String(hostHeader || "")
    .trim()
    .toLowerCase()
    .split(":")[0];
}

function extractSubdomain(hostHeader) {
  const host = stripPort(hostHeader);
  if (!host) return null;

  const parts = host.split(".").filter(Boolean);
  if (parts.length >= 3) {
    return parts[0];
  }

  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0];
  }

  return null;
}

function sanitizeSubdomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

function extractRequestPharmacyId(req) {
  const candidates = [
    req.pharmacyId,
    req.params?.pharmacyId,
    req.query?.pharmacyId,
    req.body?.pharmacyId,
    req.headers?.["x-pharmacy-id"],
  ];

  for (const candidate of candidates) {
    const normalized = cleanString(candidate);
    if (normalized && isValidObjectId(normalized)) {
      return normalized;
    }
  }

  return null;
}

async function resolvePharmacyFromSubdomain(req, res, next) {
  try {
    const host = req.headers.host;
    if (!host) {
      return res.status(400).json({ error: "Host header is required" });
    }

    const hostSubdomain = extractSubdomain(host);
    const headerSubdomain = sanitizeSubdomain(req.headers["x-tenant-subdomain"]);
    const subdomain = hostSubdomain || headerSubdomain;
    const hasValidSubdomain = !!subdomain && !RESERVED_SUBDOMAINS.has(subdomain);
    const requestPharmacyId = extractRequestPharmacyId(req);
    const userPharmacyId = cleanString(req.user?.pharmacyId);
    const canUseUserPharmacyId = isValidObjectId(userPharmacyId);

    let pharmacy = null;
    if (requestPharmacyId) {
      pharmacy = await Pharmacy.findById(requestPharmacyId).select(
        "_id name subdomain ownerId ownerUserId isActive subscriptionStatus"
      );
    } else if (hasValidSubdomain) {
      pharmacy = await Pharmacy.findOne({ subdomain }).select(
        "_id name subdomain ownerId ownerUserId isActive subscriptionStatus"
      );
    } else if (canUseUserPharmacyId) {
      pharmacy = await Pharmacy.findById(userPharmacyId).select(
        "_id name subdomain ownerId ownerUserId isActive subscriptionStatus"
      );
    } else {
      return res.status(400).json({
        error: "A valid pharmacy subdomain is required",
      });
    }

    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }

    if (!pharmacy.isActive) {
      return res.status(403).json({ error: "Pharmacy is disabled" });
    }

    req.subdomain = pharmacy.subdomain || subdomain || "";
    req.pharmacy = pharmacy;
    req.pharmacyId = String(pharmacy._id);
    return next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = resolvePharmacyFromSubdomain;
