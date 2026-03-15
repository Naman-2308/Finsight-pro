const express = require("express");
const router = express.Router();

const { loadDemoData, clearDemoData } = require("../controllers/demoController");
const { protect } = require("../middleware/authMiddleware");

router.post("/load", protect, loadDemoData);
router.delete("/clear", protect, clearDemoData);

module.exports = router;
