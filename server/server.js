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
const taskRoutes = require("./routes/taskRoutes");
const chronicPatientRoutes = require("./routes/chronicPatientRoutes");
const preparationRoutes = require("./routes/preparationRoutes");
const inBodyRoutes = require("./routes/inBodyRoutes");
const staffRoutes = require("./routes/staffRoutes");
const activityLogsRoutes = require("./routes/activityLogs");
const superadminRoutes = require("./routes/superadmin");
const User = require("./models/User");

const app = express();
const serverPort = Number.parseInt(process.env.PORT || "5000", 10);
let isDatabaseReady = false;

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

function isAllowedLocalhostOrigin(candidateOrigin) {
  try {
    const parsedOrigin = new URL(candidateOrigin);
    const protocol = String(parsedOrigin.protocol || "").toLowerCase();
    const hostname = String(parsedOrigin.hostname || "").toLowerCase();
    return protocol === "http:" && hostname === "localhost";
  } catch (_error) {
    return false;
  }
}

const trustProxy = resolveTrustProxy(process.env.TRUST_PROXY);
const corsOrigins = collectAllowedOrigins(
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_AUTH_SUCCESS_URL,
  process.env.FRONTEND_AUTH_FAILURE_URL,
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

          // Local path-based frontend URL like http://localhost:3000
          if (isAllowedLocalhostOrigin(origin)) {
            return callback(null, true);
          }

          if (isAuthDebugEnabled()) {
            console.warn(`[cors] Blocked origin: ${origin}`);
          }
          return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Authorization", "Content-Type", "X-Pharmacy-Slug", "X-Pharmacy-Id"],
        credentials: false,
        maxAge: 86_400,
      }
    : {};

app.use(cors(corsOptions));
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
app.use("/api/tasks", taskRoutes);
app.use("/api/chronic-patients", chronicPatientRoutes);
app.use("/api/preparations", preparationRoutes);
app.use("/api/inbody", inBodyRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/activity-logs", activityLogsRoutes);
app.use("/activity-logs", activityLogsRoutes);
app.use("/api/superadmin", superadminRoutes);

app.get("/", (req, res) => {
  res.send("Pharmacy Manager API");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    databaseReady: isDatabaseReady,
  });
});

app.get("/ready", (req, res) => {
  if (!isDatabaseReady) {
    return res.status(503).json({
      ok: false,
      databaseReady: false,
    });
  }

  return res.status(200).json({
    ok: true,
    databaseReady: true,
  });
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
  String(process.env[name]).startsWith("replace-with-"),
);

if (missingServerEnv.length > 0 || placeholderServerEnv.length > 0) {
  throw new Error(
    `Invalid server environment variable(s): ${[
      ...missingServerEnv,
      ...placeholderServerEnv,
    ].join(", ")}`,
  );
}

function hasExpectedPartialStringFilter(indexSpec, fieldName) {
  const filter = indexSpec?.partialFilterExpression?.[fieldName];
  return (
    filter &&
    typeof filter === "object" &&
    filter.$exists === true &&
    filter.$type === "string"
  );
}

async function ensureUniqueStringIndex(indexName, fieldName) {
  const indexes = await User.collection.indexes();
  const existingIndex = indexes.find((index) => index.name === indexName);
  const hasExpectedFilter = hasExpectedPartialStringFilter(
    existingIndex,
    fieldName,
  );

  if (existingIndex && !hasExpectedFilter) {
    await User.collection.dropIndex(indexName);
  }

  await User.collection.createIndex(
    { [fieldName]: 1 },
    {
      name: indexName,
      unique: true,
      partialFilterExpression: {
        [fieldName]: { $exists: true, $type: "string" },
      },
    },
  );
}

const server = app.listen(serverPort, "0.0.0.0", () => {
  console.log(`Server listening on port ${serverPort}`);
  console.log("Connecting to MongoDB...");
});

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 20000,
    });
    await ensureUniqueStringIndex("googleId_1", "googleId");
    await ensureUniqueStringIndex("email_1", "email");
    isDatabaseReady = true;
    console.log("MongoDB connected successfully");
    await runMigrations();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    server.close(() => {
      process.exit(1);
    });
  }
}

async function runMigrations() {
  try {
    const Patient = require("./models/Patient");
    const InBodyTest = require("./models/InBodyTest");

    const subResult = await Patient.updateMany(
      {
        "subscription.remainingSessions": { $gt: 0 },
        $or: [
          { "subscription.totalSessions": { $exists: false } },
          { "subscription.totalSessions": 0 },
        ],
      },
      [
        {
          $set: {
            "subscription.totalSessions": { $ifNull: ["$subscription.remainingSessions", 0] },
            "subscription.updatedAt": { $ifNull: ["$createdAt", new Date(0)] },
            "subscription.lifetimeRevenue": { $ifNull: ["$subscription.price", 0] },
          },
        },
      ],
    );
    if (subResult.modifiedCount > 0) {
      console.log(`[MIGRATION] Backfilled subscription fields for ${subResult.modifiedCount} patients`);
    }

    const testResult = await InBodyTest.updateMany(
      { revenue: { $exists: false } },
      { $set: { revenue: 0, consumedSession: false } },
    );
    if (testResult.modifiedCount > 0) {
      console.log(`[MIGRATION] Backfilled revenue for ${testResult.modifiedCount} tests`);
    }
  } catch (err) {
    console.error("[MIGRATION] Error:", err.message);
  }
}

connectToDatabase();

