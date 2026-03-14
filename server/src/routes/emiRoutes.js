const express = require("express");
const router = express.Router();

const {
  createEmi,
  getEmis,
  deleteEmi,
  getEmiOverview,
} = require("../controllers/emiController");

const { protect } = require("../middleware/authMiddleware");

router.route("/").post(protect, createEmi).get(protect, getEmis);
router.route("/overview").get(protect, getEmiOverview);
router.route("/:id").delete(protect, deleteEmi);

module.exports = router;
