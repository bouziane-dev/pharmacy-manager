const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "pharmacist"],
      required: true,
    },
  },
  { timestamps: true }
);

membershipSchema.index({ userId: 1, pharmacyId: 1 }, { unique: true });

module.exports = mongoose.model("Membership", membershipSchema);
