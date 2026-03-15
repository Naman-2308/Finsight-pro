const Expense = require("../models/Expense");
const Finance = require("../models/Finance");
const Emi = require("../models/Emi");
const InvestmentProfile = require("../models/InvestmentProfile");

const loadDemoData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Clear existing user data first so demo stays predictable
    await Promise.all([
      Expense.deleteMany({ user: userId }),
      Emi.deleteMany({ user: userId }),
      Finance.deleteMany({ user: userId }),
      InvestmentProfile.deleteMany({ user: userId }),
    ]);

    await Finance.create({
      user: userId,
      monthlySalary: 50000,
      monthlyBudget: 30000,
    });

    await InvestmentProfile.create({
      user: userId,
      riskProfile: "Moderate",
    });

    await Emi.insertMany([
      {
        user: userId,
        title: "Bike EMI",
        monthlyAmount: 3500,
        remainingMonths: 14,
        interestRate: 11,
      },
      {
        user: userId,
        title: "Laptop EMI",
        monthlyAmount: 2200,
        remainingMonths: 8,
        interestRate: 13,
      },
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const demoExpenses = [
      // Current month
      {
        user: userId,
        title: "Swiggy Order",
        amount: 450,
        category: "Food",
        date: new Date(currentYear, currentMonth, 2),
      },
      {
        user: userId,
        title: "Uber Ride",
        amount: 280,
        category: "Transport",
        date: new Date(currentYear, currentMonth, 3),
      },
      {
        user: userId,
        title: "Groceries",
        amount: 1800,
        category: "Food",
        date: new Date(currentYear, currentMonth, 5),
      },
      {
        user: userId,
        title: "Netflix Subscription",
        amount: 649,
        category: "Entertainment",
        date: new Date(currentYear, currentMonth, 6),
      },
      {
        user: userId,
        title: "Electricity Bill",
        amount: 2100,
        category: "Bills",
        date: new Date(currentYear, currentMonth, 8),
      },
      {
        user: userId,
        title: "Amazon Shopping",
        amount: 3200,
        category: "Shopping",
        date: new Date(currentYear, currentMonth, 10),
      },
      {
        user: userId,
        title: "Petrol",
        amount: 1500,
        category: "Transport",
        date: new Date(currentYear, currentMonth, 12),
      },
      {
        user: userId,
        title: "Dining Out",
        amount: 1200,
        category: "Food",
        date: new Date(currentYear, currentMonth, 14),
      },

      // Previous month
      {
        user: userId,
        title: "Zomato Order",
        amount: 300,
        category: "Food",
        date: new Date(currentYear, currentMonth - 1, 4),
      },
      {
        user: userId,
        title: "Metro Card Recharge",
        amount: 1000,
        category: "Transport",
        date: new Date(currentYear, currentMonth - 1, 7),
      },
      {
        user: userId,
        title: "Movie Tickets",
        amount: 900,
        category: "Entertainment",
        date: new Date(currentYear, currentMonth - 1, 9),
      },
      {
        user: userId,
        title: "Phone Bill",
        amount: 799,
        category: "Bills",
        date: new Date(currentYear, currentMonth - 1, 11),
      },
      {
        user: userId,
        title: "Clothing Purchase",
        amount: 2200,
        category: "Shopping",
        date: new Date(currentYear, currentMonth - 1, 15),
      },
      {
        user: userId,
        title: "Supermarket",
        amount: 1400,
        category: "Food",
        date: new Date(currentYear, currentMonth - 1, 18),
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
      Expense.deleteMany({ user: userId }),
      Emi.deleteMany({ user: userId }),
      Finance.deleteMany({ user: userId }),
      InvestmentProfile.deleteMany({ user: userId }),
    ]);

    res.status(200).json({
      message: "Demo data cleared successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loadDemoData,
  clearDemoData,
};
