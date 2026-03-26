const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "owner", "staff"],
      required: true,
      default: "owner",
      index: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      default: null,
    },
    pinHash: {
      type: String,
      default: null,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    staffRole: {
      type: String,
      default: "staff",
      trim: true,
    },
    googleId: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: undefined,
    },
    displayName: {
      type: String,
      trim: true,
      default: "",
    },
    picture: {
      type: String,
      default: "",
      trim: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    primaryRole: {
      type: String,
      enum: ["superadmin", "owner", "pharmacist", null],
      default: null,
    },
    subscriptionActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ pharmacyId: 1 });
userSchema.index({ pharmacyId: 1, name: 1 });
userSchema.index(
  { googleId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      googleId: { $exists: true, $type: "string" },
    },
  }
);
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $exists: true, $type: "string" },
    },
  }
);

userSchema.pre("validate", function normalizeAndValidate(next) {
  if (!this.email) {
    this.email = undefined;
  }
  if (!this.name && this.displayName) {
    this.name = this.displayName;
  }
  if (!this.displayName && this.name) {
    this.displayName = this.name;
  }

  if (this.role === "owner") {
    if (!this.email) {
      return next(new Error("Owner users must have an email"));
    }
    this.pinHash = null;
    this.staffRole = "owner";
    if (!this.primaryRole) {
      this.primaryRole = "owner";
    }
  }

  if (this.role === "superadmin") {
    if (!this.email) {
      return next(new Error("Superadmin users must have an email"));
    }
    this.pharmacyId = null;
    this.pinHash = null;
    this.staffRole = "superadmin";
    this.subscriptionActive = false;
    this.onboardingCompleted = true;
    this.primaryRole = "superadmin";
  }

  if (this.role === "staff") {
    if (!this.pharmacyId) {
      return next(new Error("Staff users must be linked to a pharmacy"));
    }
    if (!this.pinHash) {
      return next(new Error("Staff users must have a hashed PIN"));
    }
    this.googleId = undefined;
    if (!this.email) {
      this.email = undefined;
    }
    this.subscriptionActive = false;
    if (!this.primaryRole) {
      this.primaryRole = "pharmacist";
    }
  }

  return next();
});

module.exports = mongoose.model("User", userSchema);
