const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["created", "updated", "contact", "renewal", "treatment_added", "treatment_updated", "treatment_deleted", "note"],
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    authorName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 160,
    },
    actionDate: {
      type: String,
      trim: true,
      default: "",
      match: [/^\d{4}-\d{2}-\d{2}$|^$/, "Action date must be YYYY-MM-DD"],
    },
  },
  { timestamps: true },
);

const treatmentSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    dosage: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    frequency: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    frequencyQty: {
      type: String,
      trim: true,
      default: "",
      maxlength: 80,
    },
    frequencyTimes: {
      type: Number,
      min: 0,
      max: 50,
      default: null,
    },
    frequencyPeriod: {
      type: String,
      enum: ["day", "week", "month", ""],
      default: "",
      trim: true,
    },
    quantity: {
      type: String,
      trim: true,
      default: "",
      maxlength: 80,
    },
    renewalFrequency: {
      type: String,
      enum: ["30", "60", "90", "custom"],
      default: "30",
      required: true,
      trim: true,
    },
    customRenewalDays: {
      type: Number,
      min: 1,
      max: 365,
      default: null,
    },
    lastDeliveryDate: {
      type: String,
      trim: true,
      default: "",
      match: [/^\d{4}-\d{2}-\d{2}$|^$/, "Last delivery date must be YYYY-MM-DD"],
    },
    nextRenewalDate: {
      type: String,
      trim: true,
      default: "",
      match: [/^\d{4}-\d{2}-\d{2}$|^$/, "Next renewal date must be YYYY-MM-DD"],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

const chronicPatientSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d+$/, "Phone must contain digits only"],
      maxlength: 25,
    },
    caisse: {
      type: String,
      enum: ["CNAS", "CASNOS"],
      default: "CNAS",
      required: true,
      trim: true,
    },
    insuredNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: 60,
    },
    age: {
      type: Number,
      min: 0,
      max: 130,
      default: null,
    },
    birthYear: {
      type: Number,
      min: 1900,
      max: 2200,
      default: null,
    },
    dateOfBirth: {
      type: String,
      trim: true,
      default: "",
      match: [/^\d{4}-\d{2}-\d{2}$|^$/, "Date of birth must be YYYY-MM-DD"],
    },
    address: {
      type: String,
      trim: true,
      default: "",
      maxlength: 260,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
      trim: true,
      index: true,
    },
    treatments: [treatmentSchema],
    history: [historySchema],
  },
  { timestamps: true },
);

chronicPatientSchema.index({ pharmacyId: 1, fullName: 1 });
chronicPatientSchema.index({ pharmacyId: 1, phone: 1 });
chronicPatientSchema.index({ pharmacyId: 1, insuredNumber: 1 });
chronicPatientSchema.index({ pharmacyId: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model("ChronicPatient", chronicPatientSchema);
