const express = require("express");
const router = express.Router();

const {
  setInvestmentProfile,
  getInvestmentRecommendation,
} = require("../controllers/investmentController");

const { protect } = require("../middleware/authMiddleware");

router.route("/profile").post(protect, setInvestmentProfile);
router.route("/recommendation").get(protect, getInvestmentRecommendation);

module.exports = router;

