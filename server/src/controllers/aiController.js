const Expense = require("../models/Expense");
const Finance = require("../models/Finance");
const Emi = require("../models/Emi");
const { generateAdvice, buildFallbackAdvice } = require("../services/aiAdvisorService");

// Simple in-memory cache to protect Gemini and keep UI stable
const adviceCache = new Map();
const ADVICE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCacheKey(userId) {
  return String(userId);
}

function getCachedAdvice(userId) {
  const key = getCacheKey(userId);
  const cached = adviceCache.get(key);

  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > ADVICE_CACHE_TTL_MS;
  if (isExpired) {
    adviceCache.delete(key);
    return null;
  }

  return cached.advice;
}

function setCachedAdvice(userId, advice) {
  const key = getCacheKey(userId);
  adviceCache.set(key, {
    advice,
    timestamp: Date.now(),
  });
}

function round1(value) {
  return Number(Number(value || 0).toFixed(1));
}

async function getAIAdvice(req, res) {
  try {
    const userId = req.user._id;

    const cachedAdvice = getCachedAdvice(userId);
    if (cachedAdvice) {
      return res.json({ advice: cachedAdvice });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [categoryExpenses, monthlyExpenseAgg, finance, emis] = await Promise.all([
      Expense.aggregate([
        { $match: { user: userId } },
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
      Finance.findOne({ user: userId }).lean(),
      Emi.find({ user: userId }).lean(),
    ]);

    const totalExpense = categoryExpenses.reduce((sum, e) => sum + Number(e.total || 0), 0);
    const spentThisMonth = Number(monthlyExpenseAgg[0]?.total || 0);

    const totalMonthlyEMI = emis.reduce(
      (sum, e) => sum + Number(e.monthlyAmount || 0),
      0
    );

    const monthlySalary = Number(finance?.monthlySalary || 0);
    const monthlyBudget = Number(finance?.monthlyBudget || 0);

    const remainingBudget = Math.max(monthlyBudget - spentThisMonth, 0);
    const estimatedSavings = Math.max(
      monthlySalary - spentThisMonth - totalMonthlyEMI,
      0
    );

    const budgetUsedPercentage =
      monthlyBudget > 0 ? round1((spentThisMonth / monthlyBudget) * 100) : 0;

    const emiBurdenPercentage =
      monthlySalary > 0 ? round1((totalMonthlyEMI / monthlySalary) * 100) : 0;

    const payload = {
      totalExpense,
      monthlySalary,
      monthlyBudget,
      spentThisMonth,
      remainingBudget,
      estimatedSavings,
      budgetUsedPercentage,
      totalMonthlyEMI,
      emiBurdenPercentage,
      categoryBreakdown: categoryExpenses.map((e) => ({
        category: e._id || "Other",
        total: Number(e.total || 0),
      })),
    };

    let advice;

    try {
      advice = await generateAdvice(payload);
    } catch (error) {
      console.error("AI advice generation failed, using fallback:", error?.message || error);
      advice = buildFallbackAdvice(payload);
    }

    setCachedAdvice(userId, advice);

    return res.json({ advice });
  } catch (error) {
    console.error("AI advice controller error:", error);

    // Absolute fallback: keep response shape stable for web + mobile
    const safeFallback = buildFallbackAdvice({
      totalExpense: 0,
      monthlySalary: 0,
      monthlyBudget: 0,
      spentThisMonth: 0,
      remainingBudget: 0,
      estimatedSavings: 0,
      budgetUsedPercentage: 0,
      totalMonthlyEMI: 0,
      emiBurdenPercentage: 0,
      categoryBreakdown: [],
    });

    return res.json({ advice: safeFallback });
  }
}

module.exports = {
  getAIAdvice,
};