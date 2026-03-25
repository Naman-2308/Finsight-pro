const sharp = require("sharp");
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

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function extractAmount(text) {
  const matches = text.match(/(\d+(?:\.\d{1,2})?)/g);
  if (!matches) return 0;
  return Math.max(...matches.map(Number));
}

function detectCategory(text) {
  const t = String(text || "").toLowerCase();

  if (
    t.includes("restaurant") ||
    t.includes("food") ||
    t.includes("cafe") ||
    t.includes("dining")
  ) {
    return "Food";
  }

  if (
    t.includes("uber") ||
    t.includes("ola") ||
    t.includes("petrol") ||
    t.includes("fuel") ||
    t.includes("metro") ||
    t.includes("taxi")
  ) {
    return "Transport";
  }

  if (
    t.includes("mall") ||
    t.includes("shopping") ||
    t.includes("retail") ||
    t.includes("fashion")
  ) {
    return "Shopping";
  }

  if (
    t.includes("electricity") ||
    t.includes("water") ||
    t.includes("internet") ||
    t.includes("phone")
  ) {
    return "Bills";
  }

  return "Other";
}

async function normalizeImageBuffer(buffer) {
  try {
    return await sharp(buffer)
      .rotate()
      .grayscale()
      .normalize()
      .png()
      .toBuffer();
  } catch (error) {
    throw {
      statusCode: 422,
      message:
        "Uploaded image could not be processed. Please use a clearer JPG or PNG receipt image.",
    };
  }
}

async function runOCR(buffer) {
  const Tesseract = require("tesseract.js");

  const cleanBuffer = await normalizeImageBuffer(buffer);

  const result = await withTimeout(
    Tesseract.recognize(cleanBuffer, "eng"),
    25000,
    "OCR timeout"
  );

  return result?.data?.text || "";
}

function normalizeBills(parsed) {
  const bills = Array.isArray(parsed?.bills) ? parsed.bills : [];

  return bills.map((bill, billIndex) => ({
    merchant: bill?.merchant || "Unknown Merchant",
    title: bill?.title || `Scanned Bill ${billIndex + 1}`,
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
}

function getReceiptSignals(rawText) {
  const text = String(rawText || "").toLowerCase();

  const keywordSignals = [
    "total",
    "subtotal",
    "tax",
    "discount",
    "invoice",
    "receipt",
    "cash",
    "card",
    "amount",
    "qty",
    "item",
    "balance",
    "gst",
    "vat",
    "bill",
    "change",
  ];

  const currencySignals = [
    "₹",
    "rs",
    "inr",
    "$",
    "usd",
    "eur",
    "aed",
    "£",
  ];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const keywordCount = keywordSignals.filter((k) => text.includes(k)).length;
  const currencyCount = currencySignals.filter((k) => text.includes(k)).length;

  const itemPriceLineCount = lines.filter((line) => {
    const hasWord = /[a-zA-Z]{2,}/.test(line);
    const hasPrice = /\d+(?:\.\d{1,2})/.test(line);
    return hasWord && hasPrice;
  }).length;

  const totalLikeLineCount = lines.filter((line) => {
    return /(total|subtotal|grand total|amount|net amount|balance)/i.test(line);
  }).length;

  return {
    keywordCount,
    currencyCount,
    itemPriceLineCount,
    totalLikeLineCount,
    lineCount: lines.length,
  };
}

function looksLikeReceipt(rawText) {
  const signals = getReceiptSignals(rawText);

  let score = 0;

  if (signals.keywordCount >= 2) score += 2;
  if (signals.currencyCount >= 1) score += 2;
  if (signals.itemPriceLineCount >= 2) score += 3;
  if (signals.totalLikeLineCount >= 1) score += 3;
  if (signals.lineCount >= 4) score += 1;

  return score >= 5;
}

async function refineWithAI(rawText) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
  });

  const prompt = `
You are a professional receipt parser.

First determine whether the OCR text below is actually from a shopping/payment receipt or bill.

If it is NOT a receipt, return exactly:
{"isReceipt":false,"bills":[]}

If it IS a receipt, return JSON in this exact structure:
{
  "isReceipt": true,
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
- Return JSON only
- If not clearly a receipt, set isReceipt=false
- Do not guess totals for non-receipt text
- Do not invent bills if the text is not receipt-like

OCR text:
${rawText}
`;

  const result = await withTimeout(
    model.generateContent(prompt),
    12000,
    "AI refinement timeout"
  );

  const text = result.response.text();
  const parsed = JSON.parse(extractJson(text));

  return {
    isReceipt: Boolean(parsed?.isReceipt),
    bills: normalizeBills(parsed),
    raw: text,
  };
}

async function scanReceiptFromBuffer(buffer, mimeType) {
  let rawText = "";

  try {
    rawText = await runOCR(buffer);

    if (!rawText || rawText.trim().length < 8) {
      throw {
        statusCode: 422,
        message:
          "Could not read the image clearly. Please upload a proper receipt image.",
      };
    }

    const heuristicReceipt = looksLikeReceipt(rawText);

    try {
      const aiResult = await refineWithAI(rawText);

      if (aiResult?.isReceipt && aiResult?.bills?.length) {
        return aiResult;
      }

      if (!aiResult?.isReceipt) {
        throw {
          statusCode: 422,
          message: "Please upload a correct receipt image.",
        };
      }
    } catch (aiError) {
      console.error(
        "AI refinement failed, checking OCR fallback:",
        aiError?.message || aiError
      );

      if (aiError?.statusCode) {
        throw aiError;
      }
    }

    if (!heuristicReceipt) {
      throw {
        statusCode: 422,
        message: "Please upload a correct receipt image.",
      };
    }

    const fallbackAmount = extractAmount(rawText);

    if (!fallbackAmount || fallbackAmount <= 0) {
      throw {
        statusCode: 422,
        message: "Please upload a correct receipt image.",
      };
    }

    return {
      bills: [
        {
          merchant: "Unknown Merchant",
          title: "Scanned Receipt",
          totalAmount: fallbackAmount,
          category: detectCategory(rawText),
          date: new Date().toISOString().slice(0, 10),
          notes: rawText.slice(0, 300),
          items: [],
        },
      ],
      raw: rawText,
    };
  } catch (error) {
    const message = String(error?.message || "");
    console.error("Receipt scanner service error:", message);

    if (error?.statusCode && error?.message) {
      throw error;
    }

    if (
      error?.status === 429 ||
      message.includes("429") ||
      message.toLowerCase().includes("too many requests") ||
      message.toLowerCase().includes("rate limit") ||
      message.toLowerCase().includes("resource_exhausted")
    ) {
      throw {
        statusCode: 429,
        message:
          "Receipt scanning is temporarily busy. Please wait a few seconds and try again.",
      };
    }

    if (message.toLowerCase().includes("ocr timeout")) {
      throw {
        statusCode: 408,
        message:
          "Receipt OCR took too long. Please try a smaller or clearer image.",
      };
    }

    if (message.toLowerCase().includes("attempting to read image")) {
      throw {
        statusCode: 422,
        message:
          "This image format could not be read properly. Please upload a normal JPG or PNG receipt image.",
      };
    }

    if (message.toLowerCase().includes("timeout")) {
      throw {
        statusCode: 408,
        message:
          "Receipt scan took too long. Please try a clearer image and retry.",
      };
    }

    if (
      message.toLowerCase().includes("json") ||
      message.toLowerCase().includes("no json found")
    ) {
      throw {
        statusCode: 422,
        message: "Please upload a correct receipt image.",
      };
    }

    throw {
      statusCode: 500,
      message:
        "Receipt scanning failed due to a processing issue. Please try again.",
    };
  }
}

module.exports = {
  scanReceiptFromBuffer,
  normalizeCategory,
  ALLOWED_CATEGORIES,
};