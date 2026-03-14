const mongoose = require("mongoose");

const financeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    monthlySalary: {
      type: Number,
      required: true,
      default: 0,
    },
    monthlyBudget: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Finance", financeSchema);
