const Expense = require("../models/Expense");
const mongoose = require("mongoose");

// ================================
// CREATE EXPENSE
// ================================
const createExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (!title || !amount || !category || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const expense = await Expense.create({
      title,
      amount: Number(amount),
      category,
      date,
      user: req.user._id,
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET ALL EXPENSES WITH FILTERS
// ================================
const getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    const filter = {
      user: req.user._id,
    };

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const expenses = await Expense.find(filter).sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// UPDATE EXPENSE
// ================================
const updateExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    expense.title = title || expense.title;
    expense.amount = amount ? Number(amount) : expense.amount;
    expense.category = category || expense.category;
    expense.date = date || expense.date;

    const updatedExpense = await expense.save();

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// DELETE EXPENSE
// ================================
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await expense.deleteOne();

    res.json({ message: "Expense removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// SUMMARY API
// ================================
const getSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayResult, weekResult, monthResult, expenseCount] =
      await Promise.all([
        Expense.aggregate([
          {
            $match: {
              user: userId,
              date: { $gte: startOfToday },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]),
        Expense.aggregate([
          {
            $match: {
              user: userId,
              date: { $gte: startOfWeek },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]),
        Expense.aggregate([
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
        ]),
        Expense.countDocuments({ user: userId }),
      ]);

    res.json({
      todayExpense: todayResult[0]?.total || 0,
      weekExpense: weekResult[0]?.total || 0,
      monthExpense: monthResult[0]?.total || 0,
      expenseCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// ANALYTICS (PRODUCT READY)
// ================================
const getAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const totalResult = await Expense.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalExpense = totalResult[0]?.total || 0;

    const categoryRaw = await Expense.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
    ]);

    const categoryBreakdown = categoryRaw.map((item) => ({
      category: item._id,
      total: item.total,
      percentage:
        totalExpense > 0
          ? Number(((item.total / totalExpense) * 100).toFixed(2))
          : 0,
    }));

    const monthlyRaw = await Expense.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthlyTrend = monthlyRaw.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      label: `${item._id.month}/${item._id.year}`,
      total: item.total,
    }));

    res.json({
      totalExpense,
      categoryBreakdown,
      monthlyTrend,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getSummary,
  getAnalytics,
};
