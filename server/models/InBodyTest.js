const mongoose = require("mongoose");

const inBodyTestSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    testData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2500,
      default: "",
    },
    testedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

inBodyTestSchema.index({ pharmacyId: 1, patientId: 1, testedAt: -1 });

module.exports = mongoose.model("InBodyTest", inBodyTestSchema);
