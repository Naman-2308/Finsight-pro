const Expense = require("../models/Expense");
const Finance = require("../models/Finance");
const Emi = require("../models/Emi");
const InvestmentProfile = require("../models/InvestmentProfile");

const DEMO_EXPENSE_TITLES = [
  "Swiggy Order",
  "Uber Ride",
  "Groceries",
  "Netflix Subscription",
  "Electricity Bill",
  "Amazon Shopping",
  "Petrol",
  "Dining Out",
  "Zomato Order",
  "Metro Card Recharge",
  "Movie Tickets",
  "Phone Bill",
  "Clothing Purchase",
  "Supermarket",
];

const DEMO_EMI_TITLES = ["Bike EMI", "Laptop EMI"];

async function getUserDataState(userId) {
  const [expenseCount, emiCount, financeDoc, investmentDoc] = await Promise.all([
    Expense.countDocuments({
      user: userId,
      isDemo: { $ne: true },
      title: { $nin: DEMO_EXPENSE_TITLES },
    }),
    Emi.countDocuments({
      user: userId,
      isDemo: { $ne: true },
      title: { $nin: DEMO_EMI_TITLES },
    }),
    Finance.findOne({ user: userId, isDemo: { $ne: true } }),
    InvestmentProfile.findOne({ user: userId, isDemo: { $ne: true } }),
  ]);

  const [demoExpenseCount, demoEmiCount, demoFinanceDoc, demoInvestmentDoc] =
    await Promise.all([
      Expense.countDocuments({
        user: userId,
        $or: [{ isDemo: true }, { title: { $in: DEMO_EXPENSE_TITLES } }],
      }),
      Emi.countDocuments({
        user: userId,
        $or: [{ isDemo: true }, { title: { $in: DEMO_EMI_TITLES } }],
      }),
      Finance.findOne({ user: userId, isDemo: true }),
      InvestmentProfile.findOne({ user: userId, isDemo: true }),
    ]);

  const hasRealData =
    expenseCount > 0 || emiCount > 0 || !!financeDoc || !!investmentDoc;

  const hasDemoData =
    demoExpenseCount > 0 ||
    demoEmiCount > 0 ||
    !!demoFinanceDoc ||
    !!demoInvestmentDoc;

  return {
    hasRealData,
    hasDemoData,
    canLoadDemo: !hasRealData,
  };
}

const getDemoStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const state = await getUserDataState(userId);

    res.status(200).json(state);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loadDemoData = async (req, res) => {
  try {
    const userId = req.user._id;
    const state = await getUserDataState(userId);

    if (state.hasRealData) {
      return res.status(400).json({
        message: "Demo data can only be loaded for new users with no real data.",
      });
    }

    await Promise.all([
      Expense.deleteMany({
        user: userId,
        $or: [{ isDemo: true }, { title: { $in: DEMO_EXPENSE_TITLES } }],
      }),
      Emi.deleteMany({
        user: userId,
        $or: [{ isDemo: true }, { title: { $in: DEMO_EMI_TITLES } }],
      }),
      Finance.deleteMany({ user: userId, isDemo: true }),
      InvestmentProfile.deleteMany({ user: userId, isDemo: true }),
    ]);

    await Finance.create({
      user: userId,
      monthlySalary: 50000,
      monthlyBudget: 30000,
      isDemo: true,
    });

    await InvestmentProfile.create({
      user: userId,
      riskProfile: "Moderate",
      isDemo: true,
    });

    await Emi.insertMany([
      {
        user: userId,
        title: "Bike EMI",
        monthlyAmount: 3500,
        remainingMonths: 14,
        interestRate: 11,
        isDemo: true,
      },
      {
        user: userId,
        title: "Laptop EMI",
        monthlyAmount: 2200,
        remainingMonths: 8,
        interestRate: 13,
        isDemo: true,
      },
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const demoExpenses = [
      {
        user: userId,
        title: "Swiggy Order",
        amount: 450,
        category: "Food",
        date: new Date(currentYear, currentMonth, 2),
        isDemo: true,
      },
      {
        user: userId,
        title: "Uber Ride",
        amount: 280,
        category: "Transport",
        date: new Date(currentYear, currentMonth, 3),
        isDemo: true,
      },
      {
        user: userId,
        title: "Groceries",
        amount: 1800,
        category: "Food",
        date: new Date(currentYear, currentMonth, 5),
        isDemo: true,
      },
      {
        user: userId,
        title: "Netflix Subscription",
        amount: 649,
        category: "Entertainment",
        date: new Date(currentYear, currentMonth, 6),
        isDemo: true,
      },
      {
        user: userId,
        title: "Electricity Bill",
        amount: 2100,
        category: "Bills",
        date: new Date(currentYear, currentMonth, 8),
        isDemo: true,
      },
      {
        user: userId,
        title: "Amazon Shopping",
        amount: 3200,
        category: "Shopping",
        date: new Date(currentYear, currentMonth, 10),
        isDemo: true,
      },
      {
        user: userId,
        title: "Petrol",
        amount: 1500,
        category: "Transport",
        date: new Date(currentYear, currentMonth, 12),
        isDemo: true,
      },
      {
        user: userId,
        title: "Dining Out",
        amount: 1200,
        category: "Food",
        date: new Date(currentYear, currentMonth, 14),
        isDemo: true,
      },
      {
        user: userId,
        title: "Zomato Order",
        amount: 300,
        category: "Food",
        date: new Date(currentYear, currentMonth - 1, 4),
        isDemo: true,
      },
      {
        user: userId,
        title: "Metro Card Recharge",
        amount: 1000,
        category: "Transport",
        date: new Date(currentYear, currentMonth - 1, 7),
        isDemo: true,
      },
      {
        user: userId,
        title: "Movie Tickets",
        amount: 900,
        category: "Entertainment",
        date: new Date(currentYear, currentMonth - 1, 9),
        isDemo: true,
      },
      {
        user: userId,
        title: "Phone Bill",
        amount: 799,
        category: "Bills",
        date: new Date(currentYear, currentMonth - 1, 11),
        isDemo: true,
      },
      {
        user: userId,
        title: "Clothing Purchase",
        amount: 2200,
        category: "Shopping",
        date: new Date(currentYear, currentMonth - 1, 15),
        isDemo: true,
      },
      {
        user: userId,
        title: "Supermarket",
        amount: 1400,
        category: "Food",
        date: new Date(currentYear, currentMonth - 1, 18),
        isDemo: true,
      },
    ];

    await Expense.insertMany(demoExpenses);

    res.status(200).json({
      message: "Demo data loaded successfully",
      counts: {
        expenses: demoExpenses.length,
        emis: 2,
        finance: 1,
        investmentProfile: 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearDemoData = async (req, res) => {
  try {
    const userId = req.user._id;

    await Promise.all([
      Expense.deleteMany({
        user: userId,
        $or: [{ isDemo: true }, { title: { $in: DEMO_EXPENSE_TITLES } }],
      }),
      Emi.deleteMany({
        user: userId,
        $or: [{ isDemo: true }, { title: { $in: DEMO_EMI_TITLES } }],
      }),
      Finance.deleteMany({
        user: userId,
        isDemo: true,
      }),
      InvestmentProfile.deleteMany({
        user: userId,
        isDemo: true,
      }),
    ]);

    res.status(200).json({
      message: "Demo data cleared successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDemoStatus,
  loadDemoData,
  clearDemoData,
};
