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
      default: "Moderate",
      required: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvestmentProfile", investmentProfileSchema);
