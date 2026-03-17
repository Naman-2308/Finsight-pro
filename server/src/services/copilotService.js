const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateCopilotReply({ userMessage, context }) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
  });

  const prompt = `
You are Finsight AI Copilot, a finance-only assistant inside a personal finance dashboard.

Your job:
- answer ONLY questions related to the user's financial data
- stay strictly within finance and budgeting scope
- use the provided user financial context
- give concise, practical, professional answers
- if the user asks something unrelated to finance, personal life, general knowledge, coding, entertainment, health, etc., politely refuse and say:
  "I can help only with finance-related questions inside Finsight Pro, such as spending, savings, budget, EMI, and investments."

Rules:
- Never answer non-finance questions
- Never invent user data
- If data is insufficient, say so clearly
- Keep answers useful and specific
- Prefer bullet-like clarity in plain text, but do not over-format
- If advice is risky or uncertain, say it is a suggestion, not financial certainty

User financial context:
${JSON.stringify(context, null, 2)}

User question:
${userMessage}

Return only the reply text.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

module.exports = {
  generateCopilotReply,
};

