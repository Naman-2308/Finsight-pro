const mongoose = require("mongoose");

const investmentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    riskProfile: {
      type: String,
      enum: ["Low", "Moderate", "High"],
      required: true,
      default: "Moderate",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvestmentProfile", investmentProfileSchema);
