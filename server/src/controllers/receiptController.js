const multer = require("multer");
const Expense = require("../models/Expense");
const {
  scanReceiptFromBuffer,
  normalizeCategory,
} = require("../services/receiptScannerService");

// ---------------- MULTER CONFIG ----------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// ---------------- SIMPLE RATE LIMIT ----------------
const scanRateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 1000;

function isRateLimited(userId) {
  const last = scanRateLimit.get(userId);
  if (!last) return false;
  return Date.now() - last < RATE_LIMIT_WINDOW;
}

function updateRateLimit(userId) {
  scanRateLimit.set(userId, Date.now());
}

// ---------------- SCAN RECEIPT ----------------
const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Receipt image is required" });
    }

    const userId = String(req.user?._id || "guest");

    if (isRateLimited(userId)) {
      return res.status(429).json({
        message: "Please wait a few seconds before scanning again.",
      });
    }

    updateRateLimit(userId);

    const extracted = await scanReceiptFromBuffer(
      req.file.buffer,
      req.file.mimetype
    );

    if (!extracted?.bills || extracted.bills.length === 0) {
      return res.status(422).json({
        message: "No bills detected. Try a clearer image.",
        extracted: { bills: [] },
      });
    }

    return res.status(200).json({
      message: "Receipt scanned successfully",
      extracted,
    });
  } catch (error) {
    console.error("Scan controller error:", error);

    if (error?.statusCode && error?.message) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Receipt scanning failed. Please try again.",
    });
  }
};

// ---------------- SAVE RECEIPT ----------------
const saveScannedReceipt = async (req, res) => {
  try {
    const userId = req.user._id;
    const { mode, bills } = req.body;

    if (!mode || !["billTotals", "lineItems"].includes(mode)) {
      return res.status(400).json({
        message: "mode must be either billTotals or lineItems",
      });
    }

    if (!Array.isArray(bills) || bills.length === 0) {
      return res.status(400).json({
        message: "bills array is required",
      });
    }

    const expensesToCreate = [];

    for (const bill of bills) {
      const billTitle = bill.title || "Scanned Bill";
      const billDate = bill.date || new Date();
      const billCategory = normalizeCategory(bill.category);
      const billTotalAmount = Number(bill.totalAmount || 0);

      if (mode === "billTotals") {
        if (billTotalAmount > 0) {
          expensesToCreate.push({
            user: userId,
            title: billTitle,
            amount: billTotalAmount,
            category: billCategory,
            date: new Date(billDate),
          });
        }
      }

      if (mode === "lineItems") {
        const items = Array.isArray(bill.items) ? bill.items : [];

        for (const item of items) {
          const itemAmount = Number(item.amount || 0);
          if (itemAmount <= 0) continue;

          expensesToCreate.push({
            user: userId,
            title: item.name || billTitle,
            amount: itemAmount,
            category: normalizeCategory(item.category || billCategory),
            date: new Date(billDate),
          });
        }
      }
    }

    if (expensesToCreate.length === 0) {
      return res.status(400).json({
        message: "No valid expenses found to save",
      });
    }

    const created = await Expense.insertMany(expensesToCreate);

    return res.status(201).json({
      message: "Scanned receipt data saved successfully",
      mode,
      createdCount: created.length,
      expenses: created,
    });
  } catch (error) {
    console.error("Save receipt error:", error);

    return res.status(500).json({
      message: "Failed to save scanned receipt data.",
    });
  }
};

module.exports = {
  upload,
  scanReceipt,
  saveScannedReceipt,
};