const Expense = require("../models/Expense");
const Finance = require("../models/Finance");
const Emi = require("../models/Emi");
const InvestmentProfile = require("../models/InvestmentProfile");
const { generateCopilotReply } = require("../services/copilotService");
const { getFriendlyAIError } = require("../utils/aiErrorHandler");

const chatWithCopilot = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const [expenses, finance, emis, investmentProfile] = await Promise.all([
      Expense.find({ user: userId })
        .sort({ date: -1 })
        .limit(50)
        .lean(),
      Finance.findOne({ user: userId }).lean(),
      Emi.find({ user: userId }).lean(),
      InvestmentProfile.findOne({ user: userId }).lean(),
    ]);

    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const monthlySalary = finance?.monthlySalary || 0;
    const monthlyBudget = finance?.monthlyBudget || 0;
    const totalMonthlyEMI = emis.reduce(
      (sum, emi) => sum + (emi.monthlyAmount || emi.amount || 0),
      0
    );

    const categoryBreakdownMap = {};
    for (const expense of expenses) {
      const category = expense.category || "Other";
      categoryBreakdownMap[category] =
        (categoryBreakdownMap[category] || 0) + (expense.amount || 0);
    }

    const categoryBreakdown = Object.entries(categoryBreakdownMap).map(
      ([category, total]) => ({
        category,
        total,
      })
    );

    const context = {
      monthlySalary,
      monthlyBudget,
      totalExpense,
      totalMonthlyEMI,
      estimatedSavings:
        monthlySalary > 0
          ? Math.max(monthlySalary - totalExpense - totalMonthlyEMI, 0)
          : 0,
      investmentRiskProfile: investmentProfile?.riskProfile || null,
      expenseCount: expenses.length,
      recentExpenses: expenses.slice(0, 10).map((e) => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: e.date,
      })),
      categoryBreakdown,
      emis: emis.map((emi) => ({
        title: emi.title || emi.name,
        monthlyAmount: emi.monthlyAmount || emi.amount || 0,
        remainingMonths: emi.remainingMonths || null,
        interestRate: emi.interestRate || null,
      })),
    };

    const reply = await generateCopilotReply({
      userMessage: message.trim(),
      context,
    });

    res.status(200).json({
      reply,
    });
  } catch (error) {
    const friendly = getFriendlyAIError(
      error,
      "Finsight AI Copilot is unavailable right now. Please try again later."
    );

    res.status(friendly.statusCode).json({
      message: friendly.message,
    });
  }
};

module.exports = {
  chatWithCopilot,
};

