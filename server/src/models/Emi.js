const mongoose = require("mongoose");

const emiSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    monthlyAmount: {
      type: Number,
      required: true,
    },
    remainingMonths: {
      type: Number,
      required: true,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Emi", emiSchema);
