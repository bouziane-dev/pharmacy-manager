const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const passport = require("./config/passport");
const sanitizeRequest = require("./middleware/sanitizeRequest");
const securityHeaders = require("./middleware/securityHeaders");
const simpleRateLimit = require("./middleware/simpleRateLimit");
const authRoutes = require("./routes/authRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const orderRoutes = require("./routes/orderRoutes");
const staffRoutes = require("./routes/staffRoutes");
const activityLogsRoutes = require("./routes/activityLogs");
const superadminRoutes = require("./routes/superadmin");

const app = express();

function isAuthDebugEnabled() {
  return String(process.env.AUTH_DEBUG_LOGS || "").toLowerCase() === "true";
}

function resolveTrustProxy(inputValue) {
  if (typeof inputValue === "undefined") {
    return false;
  }

  const normalized = String(inputValue).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  const asNumber = Number.parseInt(normalized, 10);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }

  return inputValue;
}

function collectAllowedOrigins(...rawValues) {
  const origins = new Set();

  rawValues
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((candidate) => {
      try {
        origins.add(new URL(candidate).origin);
      } catch (_error) {
        if (isAuthDebugEnabled()) {
          console.warn(`[cors] Ignoring invalid URL candidate: ${candidate}`);
        }
      }
    });

  return Array.from(origins);
}

const trustProxy = resolveTrustProxy(process.env.TRUST_PROXY);
const corsOrigins = collectAllowedOrigins(
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_AUTH_SUCCESS_URL,
  process.env.FRONTEND_AUTH_FAILURE_URL,
  process.env.FRONTEND_ONBOARDING_URL
);

if (isAuthDebugEnabled()) {
  console.log("[server] auth debug logging enabled");
  console.log("[server] trust proxy =", trustProxy);
  console.log("[server] allowed CORS origins =", corsOrigins);
}

app.set("trust proxy", trustProxy);

const corsOptions =
  corsOrigins.length > 0
    ? {
        origin(origin, callback) {
          // Allow non-browser or same-origin requests without an Origin header.
          if (!origin) {
            return callback(null, true);
          }

          if (corsOrigins.includes(origin)) {
            return callback(null, true);
          }

          if (isAuthDebugEnabled()) {
            console.warn(`[cors] Blocked origin: ${origin}`);
          }
          return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Authorization", "Content-Type"],
        credentials: false,
        maxAge: 86_400,
      }
    : {};

app.use(
  cors(corsOptions)
);
app.options("*", cors(corsOptions));
app.use(securityHeaders);
app.use(simpleRateLimit({ windowMs: 60_000, max: 300 }));
app.use(express.json({ limit: "20kb" }));
app.use(sanitizeRequest);
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/activity-logs", activityLogsRoutes);
app.use("/activity-logs", activityLogsRoutes);
app.use("/api/superadmin", superadminRoutes);

app.get("/", (req, res) => {
  res.send("Pharmacy Manager API");
});

app.use((error, req, res, next) => {
  if (error?.message === "Not allowed by CORS") {
    if (isAuthDebugEnabled()) {
      console.warn("[cors] Request rejected", {
        method: req.method,
        path: req.originalUrl || req.url,
        origin: req.get("origin") || null,
        ip: req.ip,
      });
    }

    return res.status(403).json({ error: "CORS origin not allowed" });
  }

  return next(error);
});

const requiredServerEnv = ["MONGO_URI", "PORT", "JWT_SECRET"];
const missingServerEnv = requiredServerEnv.filter((name) => !process.env[name]);
const placeholderServerEnv = requiredServerEnv.filter((name) =>
  String(process.env[name]).startsWith("replace-with-")
);

if (missingServerEnv.length > 0 || placeholderServerEnv.length > 0) {
  throw new Error(
    `Invalid server environment variable(s): ${[
      ...missingServerEnv,
      ...placeholderServerEnv,
    ].join(", ")}`
  );
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server listening on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
