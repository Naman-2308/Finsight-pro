const express = require("express");
const router = express.Router();

const { getAIAdvice } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.get("/advice", protect, getAIAdvice);

module.exports = router;
