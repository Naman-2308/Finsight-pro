const multer = require("multer");
const Expense = require("../models/Expense");
const {
  scanReceiptFromBuffer,
  normalizeCategory,
} = require("../services/receiptScannerService");

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

const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Receipt image is required" });
    }

    const extracted = await scanReceiptFromBuffer(
      req.file.buffer,
      req.file.mimetype
    );

    if (!extracted.bills || extracted.bills.length === 0) {
      return res.status(422).json({
        message: "No bills could be detected from the uploaded image",
      });
    }

    res.status(200).json({
      message: "Receipt scanned successfully",
      extracted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      const billDate = bill.date || new Date().toISOString().slice(0, 10);
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

    res.status(201).json({
      message: "Scanned receipt data saved successfully",
      mode,
      createdCount: created.length,
      expenses: created,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  upload,
  scanReceipt,
  saveScannedReceipt,
};
