const Finance = require("../models/Finance");
const Expense = require("../models/Expense");
const mongoose = require("mongoose");

// ===================================
// CREATE OR UPDATE FINANCE SETUP
// ===================================
const setupFinance = async (req, res) => {
  try {
    const { monthlySalary, monthlyBudget } = req.body;

    if (monthlySalary == null || monthlyBudget == null) {
      return res
        .status(400)
        .json({ message: "monthlySalary and monthlyBudget are required" });
    }

    let finance = await Finance.findOne({ user: req.user._id });

    if (finance) {
      finance.monthlySalary = Number(monthlySalary);
      finance.monthlyBudget = Number(monthlyBudget);
      await finance.save();
    } else {
      finance = await Finance.create({
        user: req.user._id,
        monthlySalary: Number(monthlySalary),
        monthlyBudget: Number(monthlyBudget),
      });
    }

    res.status(200).json(finance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================================
// GET FINANCE OVERVIEW
// ===================================
const getFinanceOverview = async (req, res) => {
  try {
    const finance = await Finance.findOne({ user: req.user._id });

    if (!finance) {
      return res.status(404).json({
        message: "Finance setup not found. Please set salary and budget first.",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthExpenseResult = await Expense.aggregate([
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

    const spentThisMonth = monthExpenseResult[0]?.total || 0;
    const remainingBudget = finance.monthlyBudget - spentThisMonth;
    const estimatedSavings = finance.monthlySalary - spentThisMonth;

    const budgetUsedPercentage =
      finance.monthlyBudget > 0
        ? Number(((spentThisMonth / finance.monthlyBudget) * 100).toFixed(2))
        : 0;

    res.json({
      monthlySalary: finance.monthlySalary,
      monthlyBudget: finance.monthlyBudget,
      spentThisMonth,
      remainingBudget,
      estimatedSavings,
      budgetUsedPercentage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  setupFinance,
  getFinanceOverview,
};
