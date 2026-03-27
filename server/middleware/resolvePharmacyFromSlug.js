const Pharmacy = require("../models/Pharmacy");
const { cleanString, isValidObjectId } = require("../utils/input");

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

function normalizeSlug(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (!normalized) return null;
  return normalized;
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

function extractRequestSlug(req) {
  const candidates = [
    req.pharmacySlug,
    req.params?.pharmacySlug,
    req.query?.pharmacySlug,
    req.query?.pharmacy,
    req.query?.slug,
    req.body?.pharmacySlug,
    req.body?.pharmacy,
    req.body?.slug,
    req.headers?.["x-pharmacy-slug"],
  ];

  for (const candidate of candidates) {
    const normalized = normalizeSlug(candidate);
    if (normalized && SLUG_PATTERN.test(normalized)) {
      return normalized;
    }
  }

  return null;
}

async function resolvePharmacyFromSlug(req, res, next) {
  try {
    const requestPharmacyId = extractRequestPharmacyId(req);
    const requestSlug = extractRequestSlug(req);
    const userPharmacyId = cleanString(req.user?.pharmacyId);
    const canUseUserPharmacyId = isValidObjectId(userPharmacyId);

    let pharmacy = null;
    if (requestPharmacyId) {
      pharmacy = await Pharmacy.findById(requestPharmacyId).select(
        "_id name subdomain ownerId ownerUserId isActive subscriptionStatus"
      );
    } else if (requestSlug) {
      pharmacy = await Pharmacy.findOne({ subdomain: requestSlug }).select(
        "_id name subdomain ownerId ownerUserId isActive subscriptionStatus"
      );
    } else if (canUseUserPharmacyId) {
      pharmacy = await Pharmacy.findById(userPharmacyId).select(
        "_id name subdomain ownerId ownerUserId isActive subscriptionStatus"
      );
    } else {
      return res.status(400).json({
        error: "A valid pharmacy slug is required",
      });
    }

    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }

    if (!pharmacy.isActive) {
      return res.status(403).json({ error: "Pharmacy is disabled" });
    }

    req.pharmacySlug = pharmacy.subdomain || requestSlug || "";
    req.pharmacy = pharmacy;
    req.pharmacyId = String(pharmacy._id);
    return next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = resolvePharmacyFromSlug;
