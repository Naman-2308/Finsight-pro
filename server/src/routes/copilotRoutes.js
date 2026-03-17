const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { chatWithCopilot } = require("../controllers/copilotController");

router.post("/chat", protect, chatWithCopilot);

module.exports = router;
