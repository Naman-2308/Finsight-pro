const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateAdvice(data) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
  });

  const prompt = `
You are a financial advisor.

Analyze this user's financial data and give exactly 3 concise insights.

Data:
Total Expense: ₹${data.totalExpense}
Monthly Salary: ₹${data.monthlySalary}
Budget Used: ${data.budgetUsedPercentage}%
Estimated Savings: ₹${data.estimatedSavings}
Total EMI: ₹${data.totalMonthlyEMI}
EMI Burden: ${data.emiBurdenPercentage}%

Category Breakdown:
${data.categoryBreakdown.map((c) => `${c.category}: ₹${c.total}`).join("\n")}

Return:
1. One spending insight
2. One warning if needed
3. One recommendation

Rules:
- Keep each point under 25 words
- Be practical
- Use plain English
- Return only the 3 bullet points
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

module.exports = { generateAdvice };
