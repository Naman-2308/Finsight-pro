const Expense = require("../models/Expense");
const Finance = require("../models/Finance");
const Emi = require("../models/Emi");
const { generateAdvice } = require("../services/aiAdvisorService");
const { getFriendlyAIError } = require("../utils/aiErrorHandler");

const getAIAdvice = async (req, res) => {
  try {
    const userId = req.user._id;

    const expenses = await Expense.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalExpense = expenses.reduce((sum, e) => sum + e.total, 0);

    const finance = await Finance.findOne({ user: userId });
    const emis = await Emi.find({ user: userId });

    const totalMonthlyEMI = emis.reduce((sum, e) => sum + e.monthlyAmount, 0);

    const monthlySalary = finance?.monthlySalary || 0;
    const monthlyBudget = finance?.monthlyBudget || 0;

    const spentThisMonth = totalExpense;
    const remainingBudget = Math.max(monthlyBudget - spentThisMonth, 0);
    const estimatedSavings = Math.max(monthlySalary - spentThisMonth - totalMonthlyEMI, 0);
    const budgetUsedPercentage =
      monthlyBudget > 0 ? ((spentThisMonth / monthlyBudget) * 100).toFixed(1) : 0;
    const emiBurdenPercentage =
      monthlySalary > 0 ? ((totalMonthlyEMI / monthlySalary) * 100).toFixed(1) : 0;

    const advice = await generateAdvice({
      totalExpense,
      monthlySalary,
      monthlyBudget,
      spentThisMonth,
      remainingBudget,
      estimatedSavings,
      budgetUsedPercentage,
      totalMonthlyEMI,
      emiBurdenPercentage,
      categoryBreakdown: expenses.map((e) => ({
        category: e._id,
        total: e.total,
      })),
    });

    res.json({ advice });
  } catch (error) {
    const friendly = getFriendlyAIError(
      error,
      "AI advice is unavailable right now. Please try again later."
    );

    res.status(friendly.statusCode).json({
      message: friendly.message,
    });
  }
};

module.exports = {
  getAIAdvice,
};
