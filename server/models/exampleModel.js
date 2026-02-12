const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const modelSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
    },

    product: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Model", modelSchema);
