const express = require("express");
const router = express.Router();

const {
  setupFinance,
  getFinanceOverview,
} = require("../controllers/financeController");

const { protect } = require("../middleware/authMiddleware");

router.route("/setup").post(protect, setupFinance);
router.route("/overview").get(protect, getFinanceOverview);

module.exports = router;

