const InvestmentProfile = require("../models/InvestmentProfile");
const Finance = require("../models/Finance");
const Expense = require("../models/Expense");
const mongoose = require("mongoose");

// ===================================
// CREATE OR UPDATE INVESTMENT PROFILE
// ===================================
const setInvestmentProfile = async (req, res) => {
  try {
    const { riskProfile } = req.body;

    if (!riskProfile) {
      return res.status(400).json({ message: "riskProfile is required" });
    }

    if (!["Low", "Moderate", "High"].includes(riskProfile)) {
      return res.status(400).json({
        message: "riskProfile must be one of: Low, Moderate, High",
      });
    }

    let profile = await InvestmentProfile.findOne({ user: req.user._id });

    if (profile) {
      profile.riskProfile = riskProfile;
      await profile.save();
    } else {
      profile = await InvestmentProfile.create({
        user: req.user._id,
        riskProfile,
      });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================================
// GET INVESTMENT RECOMMENDATION
// ===================================
const getInvestmentRecommendation = async (req, res) => {
  try {
    const finance = await Finance.findOne({ user: req.user._id });

    if (!finance) {
      return res.status(404).json({
        message: "Finance setup not found. Please complete finance setup first.",
      });
    }

    const profile = await InvestmentProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        message:
          "Investment profile not found. Please set risk profile first.",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyExpenseResult = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const spentThisMonth = monthlyExpenseResult[0]?.total || 0;
    const estimatedSavings = Math.max(finance.monthlySalary - spentThisMonth, 0);

    let sip = 0;
    let fd = 0;
    let gold = 0;
    let advice = "";

    if (profile.riskProfile === "Low") {
      sip = Math.round(estimatedSavings * 0.2);
      fd = Math.round(estimatedSavings * 0.6);
      gold = Math.round(estimatedSavings * 0.2);
      advice = "A low-risk allocation prioritizes capital safety and stability.";
    } else if (profile.riskProfile === "Moderate") {
      sip = Math.round(estimatedSavings * 0.5);
      fd = Math.round(estimatedSavings * 0.3);
      gold = Math.round(estimatedSavings * 0.2);
      advice = "A moderate-risk allocation balances growth and safety.";
    } else if (profile.riskProfile === "High") {
      sip = Math.round(estimatedSavings * 0.7);
      fd = Math.round(estimatedSavings * 0.1);
      gold = Math.round(estimatedSavings * 0.2);
      advice =
        "A high-risk allocation focuses more on long-term market-linked growth.";
    }

    res.json({
      monthlySalary: finance.monthlySalary,
      spentThisMonth,
      estimatedSavings,
      riskProfile: profile.riskProfile,
      recommendedAllocation: {
        sip,
        fd,
        gold,
      },
      advice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  setInvestmentProfile,
  getInvestmentRecommendation,
};
