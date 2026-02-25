const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
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
      enum: ["owner", "pharmacist", null],
      default: null,
    },
    subscriptionActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
