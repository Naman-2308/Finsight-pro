const Expense = require("../models/Expense");
const Finance = require("../models/Finance");
const Emi = require("../models/Emi");
const mongoose = require("mongoose");

// ===================================
// GET SMART INSIGHTS
// ===================================
const getInsights = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const finance = await Finance.findOne({ user: req.user._id });

    if (!finance) {
      return res.status(404).json({
        message: "Finance setup not found. Please complete finance setup first.",
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Monthly expense total
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

    // Category breakdown
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    // EMI total
    const emiResult = await Emi.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalMonthlyEMI: { $sum: "$monthlyAmount" },
        },
      },
    ]);

    const totalMonthlyEMI = emiResult[0]?.totalMonthlyEMI || 0;

    const monthlySalary = finance.monthlySalary || 0;
    const monthlyBudget = finance.monthlyBudget || 0;

    const remainingBudget = monthlyBudget - spentThisMonth;
    const estimatedSavings = monthlySalary - spentThisMonth;
    const budgetUsedPercentage =
      monthlyBudget > 0 ? (spentThisMonth / monthlyBudget) * 100 : 0;
    const emiBurdenPercentage =
      monthlySalary > 0 ? (totalMonthlyEMI / monthlySalary) * 100 : 0;

    const insights = [];

    // -------------------------------
    // Budget Insights
    // -------------------------------
    if (budgetUsedPercentage < 70) {
      insights.push({
        type: "positive",
        title: "Budget healthy",
        message: `You have used only ${budgetUsedPercentage.toFixed(
          2
        )}% of your monthly budget so far.`,
      });
    } else if (budgetUsedPercentage >= 70 && budgetUsedPercentage <= 100) {
      insights.push({
        type: "warning",
        title: "Budget caution",
        message: `You have already used ${budgetUsedPercentage.toFixed(
          2
        )}% of your monthly budget.`,
      });
    } else {
      insights.push({
        type: "danger",
        title: "Budget exceeded",
        message: `You have exceeded your monthly budget by ₹${Math.abs(
          remainingBudget
        ).toFixed(2)}.`,
      });
    }

    // -------------------------------
    // EMI Insights
    // -------------------------------
    if (emiBurdenPercentage > 40) {
      insights.push({
        type: "danger",
        title: "High EMI burden",
        message: `Your EMI burden is ${emiBurdenPercentage.toFixed(
          2
        )}% of your monthly salary. This is financially risky.`,
      });
    } else if (emiBurdenPercentage >= 20) {
      insights.push({
        type: "warning",
        title: "Moderate EMI burden",
        message: `Your EMI burden is ${emiBurdenPercentage.toFixed(
          2
        )}% of your salary. Be cautious before adding more EMIs.`,
      });
    } else {
      insights.push({
        type: "positive",
        title: "Low EMI burden",
        message: `Your EMI burden is under control at ${emiBurdenPercentage.toFixed(
          2
        )}% of salary.`,
      });
    }

    // -------------------------------
    // Savings Insights
    // -------------------------------
    if (estimatedSavings > 0) {
      insights.push({
        type: "saving",
        title: "Savings opportunity",
        message: `Based on current spending, you may save approximately ₹${estimatedSavings.toFixed(
          2
        )} this month.`,
      });
    } else {
      insights.push({
        type: "danger",
        title: "No savings this month",
        message:
          "Your current spending pattern leaves little or no room for savings this month.",
      });
    }

    // -------------------------------
    // Category Concentration Insight
    // -------------------------------
    if (categoryBreakdown.length > 0 && spentThisMonth > 0) {
      const topCategory = categoryBreakdown[0];
      const topCategoryPercentage = (topCategory.total / spentThisMonth) * 100;

      if (topCategoryPercentage >= 50) {
        insights.push({
          type: "warning",
          title: "Spending concentration detected",
          message: `${topCategory._id} accounts for ${topCategoryPercentage.toFixed(
            2
          )}% of your monthly expenses.`,
        });
      }
    }

    res.json({
      metrics: {
        monthlySalary,
        monthlyBudget,
        spentThisMonth,
        remainingBudget,
        estimatedSavings,
        totalMonthlyEMI,
        budgetUsedPercentage: Number(budgetUsedPercentage.toFixed(2)),
        emiBurdenPercentage: Number(emiBurdenPercentage.toFixed(2)),
      },
      insights,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInsights,
};
