const express = require("express");
const router = express.Router();

const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getSummary,
  getAnalytics,
} = require("../controllers/expenseController");

const { protect } = require("../middleware/authMiddleware");

router.route("/").post(protect, createExpense).get(protect, getExpenses);

router.route("/summary").get(protect, getSummary);

router.route("/analytics").get(protect, getAnalytics);

router.route("/:id").put(protect, updateExpense).delete(protect, deleteExpense);

module.exports = router;
