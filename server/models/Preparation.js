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
    preparationType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    composition: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2500,
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
    deliveredBy: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    status: {
      type: String,
      // Keep legacy values for backward compatibility while normalizing in controller.
      enum: [
        "en_cours",
        "prepared",
        "delivered",
        "pending",
        "in_progress",
        "completed",
      ],
      default: "en_cours",
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2500,
      default: "",
    },
  },
  { timestamps: true }
);

preparationSchema.index({ pharmacyId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Preparation", preparationSchema);
