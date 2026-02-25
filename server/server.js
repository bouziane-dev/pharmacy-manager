const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const passport = require("./config/passport");
const authRoutes = require("./routes/authRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
  res.send("Pharmacy Manager API");
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
