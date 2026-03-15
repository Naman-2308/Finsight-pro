const express = require("express");
const router = express.Router();

const { getAnomalies } = require("../controllers/anomalyController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAnomalies);

module.exports = router;
