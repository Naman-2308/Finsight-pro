const express = require("express");
const router = express.Router();

const { getBudgetPrediction } = require("../controllers/predictionController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getBudgetPrediction);

module.exports = router;
