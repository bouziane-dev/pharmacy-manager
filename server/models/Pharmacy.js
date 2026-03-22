const mongoose = require("mongoose");

const pharmacySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subdomain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

pharmacySchema.pre("validate", function normalizeOwnerFields(next) {
  if (!this.ownerId && this.ownerUserId) {
    this.ownerId = this.ownerUserId;
  }
  if (!this.ownerUserId && this.ownerId) {
    this.ownerUserId = this.ownerId;
  }
  return next();
});

module.exports = mongoose.model("Pharmacy", pharmacySchema);
