const mongoose = require("mongoose");
const Expense = require("../models/Expense");

const getMonthRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
};

const getAnomalies = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const now = new Date();

    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const { start: currentStart, end: currentEnd } = getMonthRange(currentMonthDate);
    const { start: previousStart, end: previousEnd } = getMonthRange(previousMonthDate);

    const [currentTotals, previousTotals] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: currentStart, $lt: currentEnd },
          },
        },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: previousStart, $lt: previousEnd },
          },
        },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const currentMap = {};
    const previousMap = {};

    currentTotals.forEach((item) => {
      currentMap[item._id] = item.total;
    });

    previousTotals.forEach((item) => {
      previousMap[item._id] = item.total;
    });

    const allCategories = new Set([
      ...Object.keys(currentMap),
      ...Object.keys(previousMap),
    ]);

    const anomalies = [];

    let currentMonthTotal = 0;
    let previousMonthTotal = 0;

    Object.values(currentMap).forEach((v) => {
      currentMonthTotal += v;
    });

    Object.values(previousMap).forEach((v) => {
      previousMonthTotal += v;
    });

    if (previousMonthTotal > 0) {
      const totalIncrease =
        ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;

      if (totalIncrease >= 30) {
        anomalies.push({
          type: "warning",
          title: "Overall spending spike",
          message: `Your total spending increased by ${totalIncrease.toFixed(
            1
          )}% compared to last month.`,
        });
      }
    }

    for (const category of allCategories) {
      const current = currentMap[category] || 0;
      const previous = previousMap[category] || 0;

      if (previous > 0) {
        const increase = ((current - previous) / previous) * 100;

        if (increase >= 40 && current > previous) {
          anomalies.push({
            type: "warning",
            title: `${category} spending spike`,
            message: `${category} expenses increased by ${increase.toFixed(
              1
            )}% compared to last month.`,
          });
        }
      } else if (current >= 1000) {
        anomalies.push({
          type: "info",
          title: `New ${category} spending pattern`,
          message: `You spent ₹${current.toFixed(
            0
          )} on ${category} this month, which was not present last month.`,
        });
      }
    }

    if (anomalies.length === 0) {
      anomalies.push({
        type: "positive",
        title: "Spending pattern stable",
        message: "No unusual expense spikes were detected compared to last month.",
      });
    }

    res.json({
      currentMonthTotal,
      previousMonthTotal,
      anomalies,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnomalies,
};
