const mongoose = require("mongoose");

const preparationSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    preparationId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    patientFullname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    composition: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2500,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    prescriber: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    receivedBy: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    preparedBy: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "en_cours",
        "prepared",
        "completed",
        "pending",
        "in_progress",
      ],
      default: "en_cours",
      required: true,
      index: true,
    },
    notes: [{
      text: { type: String, trim: true, maxlength: 2500 },
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: String, trim: true, maxlength: 120, default: '' }
    }],
  },
  { timestamps: true }
);

preparationSchema.index({ pharmacyId: 1, preparationId: 1 }, { unique: true });
preparationSchema.index({ pharmacyId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Preparation", preparationSchema);
