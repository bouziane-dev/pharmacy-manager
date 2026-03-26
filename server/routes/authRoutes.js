const express = require("express");
const passport = require("../config/passport");
const User = require("../models/User");
const Pharmacy = require("../models/Pharmacy");
const simpleRateLimit = require("../middleware/simpleRateLimit");
const resolvePharmacyFromSubdomain = require("../middleware/resolvePharmacyFromSubdomain");
const { signAuthToken } = require("../services/authTokenService");
const { comparePin, isValidPin, normalizePin } = require("../services/pinService");
const { logActivity } = require("../services/activityLogger");
const { cleanString, isValidObjectId } = require("../utils/input");

const router = express.Router();

function isAuthDebugEnabled() {
  return String(process.env.AUTH_DEBUG_LOGS || "").toLowerCase() === "true";
}

function getClientIp(req) {
  const expressIp = req.ip || req.socket?.remoteAddress;
  if (typeof expressIp === "string" && expressIp.trim().length > 0) {
    return expressIp.trim();
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
    const firstHop = forwardedFor.split(",")[0]?.trim();
    if (firstHop) {
      return firstHop;
    }
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return "unknown";
}

function shortHeaderValue(value, limit = 180) {
  if (!value) return null;
  const text = String(value);
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function requestContext(req) {
  const authHeader = req.get("authorization") || "";
  const [authorizationScheme] = authHeader.split(" ");

  return {
    method: req.method,
    path: req.originalUrl || req.url,
    queryKeys: Object.keys(req.query || {}),
    ip: getClientIp(req),
    origin: req.get("origin") || null,
    host: req.get("host") || null,
    referer: shortHeaderValue(req.get("referer")),
    userAgent: shortHeaderValue(req.get("user-agent")),
    forwardedFor: shortHeaderValue(req.get("x-forwarded-for")),
    authorizationScheme: authorizationScheme || null,
    hasCookieHeader: Boolean(req.get("cookie")),
    hasSessionObject: Boolean(req.session),
  };
}

function logAuthEvent(event, payload) {
  if (!isAuthDebugEnabled()) return;
  console.log(`[auth] ${event}`, payload);
}

function buildRedirectUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function encodeState(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeState(stateValue) {
  if (!stateValue) return null;
  try {
    return JSON.parse(Buffer.from(String(stateValue), "base64url").toString("utf8"));
  } catch (_error) {
    return null;
  }
}

function normalizeReturnToUrl(candidateValue) {
  const candidate = String(candidateValue || "").trim();
  if (!candidate) return null;

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch (_error) {
    return null;
  }

  const protocol = String(parsed.protocol || "").toLowerCase();
  const host = String(parsed.hostname || "").toLowerCase();
  if (protocol !== "https:" && !(protocol === "http:" && host.endsWith(".localhost"))) {
    return null;
  }

  const isProductionRoot = host === "phlowit.com" || host === "www.phlowit.com";
  const isProductionTenant = host.endsWith(".phlowit.com");
  const isLocalhost = host === "localhost" || host.endsWith(".localhost");
  if (!isProductionRoot && !isProductionTenant && !isLocalhost) {
    return null;
  }

  parsed.pathname = "/auth";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function resolveReturnToFromRequest(req) {
  const queryValue = normalizeReturnToUrl(req?.query?.returnTo);
  if (queryValue) return queryValue;

  const refererValue = normalizeReturnToUrl(req.get("referer"));
  if (refererValue) return refererValue;

  const originValue = normalizeReturnToUrl(req.get("origin"));
  if (originValue) return originValue;

  return null;
}

function buildSafeUser(user) {
  return {
    id: user._id,
    googleId: user.googleId,
    email: user.email || "",
    name: user.name || user.displayName || user.email || "",
    displayName: user.displayName || user.name || "",
    picture: user.picture || "",
    onboardingCompleted: user.onboardingCompleted,
    primaryRole: user.primaryRole,
    subscriptionActive: !!user.subscriptionActive,
    role: user.role,
    staffRole: user.staffRole,
    pharmacyId: user.pharmacyId || null,
    isActive: user.isActive !== false,
  };
}

router.get(
  "/google",
  (req, _res, next) => {
    logAuthEvent("google_start", requestContext(req));
    next();
  },
  (req, res, next) => {
    const normalizedReturnTo = resolveReturnToFromRequest(req);
    const state = encodeState({ returnTo: normalizedReturnTo });

    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      prompt: "select_account",
      state,
    })(req, res, next);
  }
);

router.get("/google/callback", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  logAuthEvent("google_callback_received", requestContext(req));

  passport.authenticate("google", { session: false }, async (error, user, info) => {
    if (error || !user) {
      logAuthEvent("google_callback_failed", {
        ...requestContext(req),
        authError: error?.message || null,
        infoMessage: info?.message || null,
        hasUser: Boolean(user),
      });

      const parsedState = decodeState(req.query.state);
      const stateReturnTo = normalizeReturnToUrl(parsedState?.returnTo);
      const normalizedFailureFallback = normalizeReturnToUrl(
        process.env.FRONTEND_AUTH_FAILURE_URL
      );
      const failureBaseUrl = stateReturnTo || normalizedFailureFallback;

      if (failureBaseUrl) {
        try {
          const failureUrl = buildRedirectUrl(failureBaseUrl, {
            error: "auth_failed",
          });
          return res.redirect(302, failureUrl);
        } catch (redirectError) {
          console.error(
            "[auth] Failed to build FRONTEND_AUTH_FAILURE_URL:",
            redirectError.message
          );
        }
      }

      return res.status(401).json({
        error: "Authentication failed",
      });
    }

    try {
      const isSuperAdmin =
        user.role === "superadmin" || user.primaryRole === "superadmin";

      if (!isSuperAdmin) {
        const ownedPharmacy = await Pharmacy.findOne({
          $or: [{ ownerId: user._id }, { ownerUserId: user._id }],
        }).sort({ createdAt: 1 });

        if (ownedPharmacy && String(user.pharmacyId || "") !== String(ownedPharmacy._id)) {
          user.pharmacyId = ownedPharmacy._id;
        }
        user.role = "owner";
        user.primaryRole = "owner";
        user.onboardingCompleted = true;
        user.subscriptionActive = true;
      } else {
        user.role = "superadmin";
        user.primaryRole = "superadmin";
        user.onboardingCompleted = true;
        user.pharmacyId = null;
        user.subscriptionActive = false;
      }
      user.isActive = user.isActive !== false;
      await user.save();

      const token = signAuthToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role || "owner",
        pharmacyId: user.pharmacyId ? String(user.pharmacyId) : undefined,
      });

      const safeUser = buildSafeUser(user);

      logAuthEvent("jwt_issued", {
        userId: safeUser.id?.toString?.() || String(safeUser.id),
        email: safeUser.email,
        tokenLength: token.length,
      });

      const parsedState = decodeState(req.query.state);
      const stateReturnTo = normalizeReturnToUrl(parsedState?.returnTo);
      const normalizedSuccessFallback = normalizeReturnToUrl(
        process.env.FRONTEND_AUTH_SUCCESS_URL
      );
      const successBaseUrl = stateReturnTo || normalizedSuccessFallback;

      if (successBaseUrl) {
        const encodedUser = Buffer.from(JSON.stringify(safeUser)).toString("base64url");
        let successUrl;
        try {
          successUrl = buildRedirectUrl(successBaseUrl, {
            token,
            user: encodedUser,
          });
        } catch (redirectError) {
          console.error(
            "[auth] Failed to build FRONTEND_AUTH_SUCCESS_URL:",
            redirectError.message
          );
          return res.status(500).json({
            error: "Invalid auth success redirect URL",
          });
        }
        return res.redirect(302, successUrl);
      }

      return res.status(200).json({
        token,
        user: safeUser,
      });
    } catch (callbackError) {
      return res.status(500).json({ error: callbackError.message });
    }
  })(req, res, next);
});

async function listPublicStaffUsers(req, res) {
  try {
    const staffUsers = await User.find({
      pharmacyId: req.pharmacyId,
      role: "staff",
      isActive: true,
    })
      .select("name displayName staffRole isActive")
      .sort({ name: 1, createdAt: 1 });

    return res.status(200).json({
      pharmacy: {
        id: req.pharmacyId,
        name: req.pharmacy.name,
        subdomain: req.pharmacy.subdomain,
      },
      users: staffUsers.map((item) => ({
        id: String(item._id),
        name: item.name || item.displayName || "Staff",
        role: item.staffRole || "staff",
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

router.get("/staff", resolvePharmacyFromSubdomain, listPublicStaffUsers);
router.get("/staff-users", resolvePharmacyFromSubdomain, listPublicStaffUsers);

router.post(
  "/pin-login",
  simpleRateLimit({ windowMs: 60_000, max: 12 }),
  resolvePharmacyFromSubdomain,
  async (req, res) => {
    try {
      const userId = cleanString(req.body.userId);
      const pin = normalizePin(req.body.pin);

      if (!userId || !isValidObjectId(userId)) {
        return res.status(400).json({ error: "Valid userId is required" });
      }

      if (!isValidPin(pin)) {
        return res.status(400).json({ error: "PIN must be between 2 and 6 digits" });
      }

      const user = await User.findOne({
        _id: userId,
        pharmacyId: req.pharmacyId,
        role: "staff",
      }).select("+pinHash");

      if (!user || user.isActive === false) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const pinMatches = await comparePin(pin, user.pinHash);
      if (!pinMatches) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = signAuthToken({
        userId: String(user._id),
        pharmacyId: String(user.pharmacyId),
        role: "staff",
      });

      await logActivity({
        action: "PIN_LOGIN",
        description: `Staff login from ${getClientIp(req)}`,
        userId: user._id,
        pharmacyId: req.pharmacyId,
        metadata: {
          userId: String(user._id),
          ip: getClientIp(req),
        },
      });

      return res.status(200).json({
        token,
        user: buildSafeUser(user),
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
