const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ALLOWED_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Travel",
  "Other",
];

function normalizeCategory(category) {
  if (!category) return "Other";

  const normalized = String(category).trim().toLowerCase();

  const map = {
    food: "Food",
    restaurant: "Food",
    groceries: "Food",
    grocery: "Food",
    dining: "Food",

    transport: "Transport",
    travelride: "Transport",
    cab: "Transport",
    taxi: "Transport",
    uber: "Transport",
    metro: "Transport",
    petrol: "Transport",
    fuel: "Transport",

    shopping: "Shopping",
    retail: "Shopping",
    clothes: "Shopping",
    clothing: "Shopping",
    fashion: "Shopping",

    bills: "Bills",
    utilities: "Bills",
    utility: "Bills",
    electricity: "Bills",
    water: "Bills",
    internet: "Bills",
    phone: "Bills",

    entertainment: "Entertainment",
    movie: "Entertainment",
    subscription: "Entertainment",
    gaming: "Entertainment",

    health: "Health",
    medical: "Health",
    pharmacy: "Health",
    medicine: "Health",
    doctor: "Health",

    education: "Education",
    tuition: "Education",
    books: "Education",
    course: "Education",

    travel: "Travel",
    hotel: "Travel",
    flight: "Travel",
    trip: "Travel",

    other: "Other",
  };

  if (map[normalized]) return map[normalized];

  const titleCase =
    normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();

  return ALLOWED_CATEGORIES.includes(titleCase) ? titleCase : "Other";
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1];

  const plain = text.match(/\{[\s\S]*\}/);
  if (plain) return plain[0];

  throw new Error("No JSON found in AI response");
}

async function scanReceiptFromBuffer(buffer, mimeType) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
  });

  const prompt = `
You are a professional receipt parser.

The uploaded image may contain:
- one receipt
- multiple receipts/bills in a single image
- visible line items inside each receipt

Return ONLY valid JSON in this exact structure:

{
  "bills": [
    {
      "merchant": "string",
      "title": "short expense title for whole bill",
      "totalAmount": 0,
      "category": "Food | Transport | Shopping | Bills | Entertainment | Health | Education | Travel | Other",
      "date": "YYYY-MM-DD",
      "notes": "string",
      "items": [
        {
          "name": "string",
          "amount": 0,
          "category": "Food | Transport | Shopping | Bills | Entertainment | Health | Education | Travel | Other"
        }
      ]
    }
  ]
}

Rules:
- Detect ALL separate bills in the image
- Each bill must appear as one object in "bills"
- "title" should be a short user-friendly title for the entire bill
- "totalAmount" must be the final paid amount for that bill
- "category" must be one of the allowed values exactly
- "date" should be receipt date if visible, otherwise today's date
- "notes" can include useful context like invoice number, tax, payment mode
- "items" should contain individual bill items if readable
- If items are not readable, return an empty array
- If merchant is unclear, use "Unknown Merchant"
- If title is unclear, infer something sensible like "Restaurant Bill", "Shopping Bill", "Salon Bill"
- For haircut / salon / grooming, category should usually be "Other" unless something else is clearly better
- Return JSON only, no explanation
`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: buffer.toString("base64"),
      },
    },
  ]);

  const text = result.response.text();
  const parsed = JSON.parse(extractJson(text));

  const bills = Array.isArray(parsed.bills) ? parsed.bills : [];

  const normalizedBills = bills.map((bill, billIndex) => ({
    merchant: bill?.merchant || "Unknown Merchant",
    title:
      bill?.title || `Scanned Bill ${billIndex + 1}`,
    totalAmount: safeNumber(bill?.totalAmount, 0),
    category: normalizeCategory(bill?.category),
    date: bill?.date || new Date().toISOString().slice(0, 10),
    notes: bill?.notes || "",
    items: Array.isArray(bill?.items)
      ? bill.items.map((item, itemIndex) => ({
          name: item?.name || `Item ${itemIndex + 1}`,
          amount: safeNumber(item?.amount, 0),
          category: normalizeCategory(item?.category || bill?.category),
        }))
      : [],
  }));

  return {
    bills: normalizedBills,
    raw: text,
  };
}

module.exports = {
  scanReceiptFromBuffer,
  normalizeCategory,
  ALLOWED_CATEGORIES,
};
