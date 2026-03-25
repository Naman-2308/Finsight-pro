const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Current best-fit model for fast, high-frequency, lightweight tasks
const AI_MODEL = "gemini-3.1-flash-lite-preview";

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("AI advice request timeout"));
      }, ms);
    }),
  ]);
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function sanitizeBullets(text) {
  const cleaned = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, ""))
    .filter(Boolean);

  const firstThree = cleaned.slice(0, 3);

  while (firstThree.length < 3) {
    firstThree.push("Keep tracking expenses regularly to improve future AI insights.");
  }

  return firstThree.map((line) => `- ${line}`).join("\n");
}

function getTopCategory(categoryBreakdown = []) {
  if (!Array.isArray(categoryBreakdown) || categoryBreakdown.length === 0) {
    return null;
  }

  return [...categoryBreakdown].sort((a, b) => Number(b.total || 0) - Number(a.total || 0))[0];
}

function buildFallbackAdvice(data) {
  const topCategory = getTopCategory(data.categoryBreakdown);
  const lines = [];

  if (data.monthlyBudget > 0) {
    if (data.budgetUsedPercentage >= 90) {
      lines.push(
        `- You have already used ${data.budgetUsedPercentage}% of your monthly budget. Slow non-essential spending for the rest of the month.`
      );
    } else if (data.budgetUsedPercentage >= 70) {
      lines.push(
        `- You have used ${data.budgetUsedPercentage}% of your monthly budget. Keep an eye on upcoming discretionary expenses.`
      );
    } else {
      lines.push(
        `- Budget usage looks controlled at ${data.budgetUsedPercentage}% this month. Your current spending pace is healthy.`
      );
    }
  } else {
    lines.push(
      "- Add your monthly budget in Finance Setup to unlock more accurate budget-based advice."
    );
  }

  if (data.totalMonthlyEMI > 0 && data.monthlySalary > 0) {
    if (data.emiBurdenPercentage >= 40) {
      lines.push(
        `- EMI burden is high at ${data.emiBurdenPercentage}% of salary. Avoid adding new debt until this ratio comes down.`
      );
    } else if (data.emiBurdenPercentage >= 20) {
      lines.push(
        `- EMI burden is moderate at ${data.emiBurdenPercentage}% of salary. Plan discretionary purchases carefully.`
      );
    } else {
      lines.push(
        `- EMI burden is manageable at ${data.emiBurdenPercentage}% of salary. Debt pressure appears under control.`
      );
    }
  } else {
    lines.push(
      "- No EMI pressure is currently recorded. Keep liabilities updated in the EMI section for better financial guidance."
    );
  }

  if (topCategory) {
    lines.push(
      `- Your top spending category is ${topCategory.category} at ${formatCurrency(
        topCategory.total
      )}. Review that category first for the easiest savings opportunity.`
    );
  } else if (data.estimatedSavings > 0) {
    lines.push(
      `- Estimated savings currently stand near ${formatCurrency(
        data.estimatedSavings
      )}. Consider moving part of it into savings or investment goals.`
    );
  } else {
    lines.push(
      "- Add more expenses and finance data to unlock more personalized AI recommendations."
    );
  }

  return lines.slice(0, 3).join("\n");
}

async function generateAdvice(data) {
  const model = genAI.getGenerativeModel({
    model: AI_MODEL,
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 180,
    },
  });

  const prompt = `
You are a practical personal finance advisor.

Analyze this user's financial data and return exactly 3 concise bullet points.

Data:
- Total Expense (all time): ${formatCurrency(data.totalExpense)}
- Monthly Salary: ${formatCurrency(data.monthlySalary)}
- Monthly Budget: ${formatCurrency(data.monthlyBudget)}
- Spent This Month: ${formatCurrency(data.spentThisMonth)}
- Remaining Budget: ${formatCurrency(data.remainingBudget)}
- Estimated Savings: ${formatCurrency(data.estimatedSavings)}
- Budget Used: ${data.budgetUsedPercentage}%
- Total Monthly EMI: ${formatCurrency(data.totalMonthlyEMI)}
- EMI Burden: ${data.emiBurdenPercentage}%

Category Breakdown:
${(data.categoryBreakdown || [])
  .map((c) => `- ${c.category}: ${formatCurrency(c.total)}`)
  .join("\n") || "- No category data available"}

Instructions:
- Return exactly 3 bullet points.
- Keep each point under 25 words.
- Use plain English.
- Include:
  1) one spending insight,
  2) one warning only if needed,
  3) one practical recommendation.
- Do not add headings.
- Do not add intro or outro text.
- Output bullet points only.
`;

  try {
    const result = await withTimeout(model.generateContent(prompt), 12000);
    const response = await result.response;
    const text = response.text();

    return sanitizeBullets(text);
  } catch (error) {
    const message = String(error?.message || "");

    if (
      error?.status === 429 ||
      message.includes("429") ||
      message.toLowerCase().includes("too many requests") ||
      message.toLowerCase().includes("rate limit") ||
      message.toLowerCase().includes("resource_exhausted")
    ) {
      throw new Error("AI advice rate limited");
    }

    if (message.toLowerCase().includes("timeout")) {
      throw new Error("AI advice timeout");
    }

    throw error;
  }
}

module.exports = {
  generateAdvice,
  buildFallbackAdvice,
};