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
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    monthlyAmount: {
      type: Number,
      min: 0,
    },
    amount: {
      type: Number,
      min: 0,
    },
    remainingMonths: {
      type: Number,
      min: 0,
    },
    interestRate: {
      type: Number,
      min: 0,
    },
    dueDate: {
      type: Date,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Emi", emiSchema);
