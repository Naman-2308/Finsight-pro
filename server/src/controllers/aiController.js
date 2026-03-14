const Expense = require("../models/Expense");
const Finance = require("../models/Finance");
const EMI = require("../models/Emi");
const { generateAdvice } = require("../services/aiAdvisorService");

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

    const emis = await EMI.find({ user: userId });

    const totalMonthlyEMI = emis.reduce((sum, e) => sum + e.amount, 0);

    const advice = await generateAdvice({
      totalExpense,
      monthlySalary: finance?.monthlySalary || 0,
      estimatedSavings: finance?.estimatedSavings || 0,
      budgetUsedPercentage: finance?.budgetUsedPercentage || 0,
      totalMonthlyEMI,
      emiBurdenPercentage:
        finance?.monthlySalary > 0
          ? ((totalMonthlyEMI / finance.monthlySalary) * 100).toFixed(1)
          : 0,
      categoryBreakdown: expenses,
    });

    res.json({ advice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAIAdvice,
};
