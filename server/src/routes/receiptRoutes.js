const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  upload,
  scanReceipt,
  saveScannedReceipt,
} = require("../controllers/receiptController");

router.post("/scan", protect, upload.single("receipt"), scanReceipt);
router.post("/save", protect, saveScannedReceipt);

module.exports = router;
