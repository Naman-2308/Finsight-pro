const Expense = require("../models/Expense");
const Finance = require("../models/Finance");

const getBudgetPrediction = async (req, res) => {
  try {
    const userId = req.user._id;

    const finance = await Finance.findOne({ user: userId });

    if (!finance) {
      return res.status(400).json({ message: "Finance setup required" });
    }

    const expenses = await Expense.find({ user: userId });

    if (expenses.length === 0) {
      return res.json({
        dailyAverage: 0,
        projectedMonthlyExpense: 0,
        daysUntilBudgetExceeded: null
      });
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    const today = new Date();
    const daysPassed = today.getDate();

    const dailyAverage = total / daysPassed;

    const projectedMonthlyExpense = Math.round(dailyAverage * 30);

    const remainingBudget = finance.monthlyBudget - total;

    const daysUntilBudgetExceeded =
      dailyAverage > 0
        ? Math.floor(remainingBudget / dailyAverage)
        : null;

    res.json({
      dailyAverage: Math.round(dailyAverage),
      projectedMonthlyExpense,
      budget: finance.monthlyBudget,
      daysUntilBudgetExceeded
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBudgetPrediction };
