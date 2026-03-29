const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },
    patientId: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d+$/, "Patient ID must contain digits only"],
      maxlength: 25,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      match: [/^\d*$/, "Phone must contain digits only"],
      maxlength: 25,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 220,
      default: "",
    },
    dateOfBirth: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator(value) {
          if (!value) return true;
          return /^\d{4}-\d{2}-\d{2}$/.test(value);
        },
        message: "Date of birth must be YYYY-MM-DD",
      },
    },
    subscription: {
      totalSessions: {
        type: Number,
        min: 0,
        max: 500,
        default: 0,
      },
      remainingSessions: {
        type: Number,
        min: 0,
        max: 500,
        default: 0,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
    lastInBodyTestAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

patientSchema.index({ pharmacyId: 1, patientId: 1 }, { unique: true });
patientSchema.index({ pharmacyId: 1, fullName: 1 });

module.exports = mongoose.model("Patient", patientSchema);
