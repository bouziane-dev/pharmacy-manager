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
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    arrivalDate: {
      type: String,
      required: true,
      trim: true,
    },
    urgency: {
      type: String,
      enum: ["Urgent", "Normal"],
      default: "Normal",
      required: true,
    },
    status: {
      type: String,
      enum: ["Not Yet", "Ordered", "Arrived"],
      default: "Not Yet",
      required: true,
    },
    comments: [orderCommentSchema],
  },
  { timestamps: true }
);

orderSchema.index({ pharmacyId: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
