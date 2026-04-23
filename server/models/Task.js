const mongoose = require("mongoose");

const taskCommentSchema = new mongoose.Schema(
  {
    authorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

const taskSchema = new mongoose.Schema(
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
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["ordonnance", "instance", "patient_appel", "autres"],
      required: true,
      trim: true,
    },
    customTypeLabel: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1500,
    },
    patientName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      match: [/^\d*$/, "Phone must contain digits only"],
    },
    agendaDate: {
      type: String,
      trim: true,
      default: "",
      match: [/^\d{4}-\d{2}-\d{2}$|^$/, "Agenda date must be YYYY-MM-DD"],
    },
    status: {
      type: String,
      enum: ["pending", "done"],
      default: "pending",
      required: true,
      trim: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    comments: [taskCommentSchema],
  },
  { timestamps: true },
);

taskSchema.path("customTypeLabel").validate(function validateCustomTaskLabel(value) {
  if (this.type !== "autres") return true;
  return Boolean(String(value || "").trim());
}, "Custom task label is required for autres");

taskSchema.index({ pharmacyId: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model("Task", taskSchema);
