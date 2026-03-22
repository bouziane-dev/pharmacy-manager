const mongoose = require("mongoose");

const orderCommentSchema = new mongoose.Schema(
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
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
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
      required: false,
      default: null,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d+$/, "Phone must contain digits only"],
    },
    products: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    // Legacy single-product field kept for old records.
    productName: {
      type: String,
      trim: true,
    },
    versement: {
      type: Number,
      default: 0,
      min: 0,
    },
    arrivalDate: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      // Keep legacy values for compatibility with old records.
      enum: ["pending", "ordered", "done", "finished", "Not Yet", "Ordered", "Arrived"],
      default: "pending",
      required: true,
    },
    comments: [orderCommentSchema],
  },
  { timestamps: true }
);

orderSchema.index({ pharmacyId: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
