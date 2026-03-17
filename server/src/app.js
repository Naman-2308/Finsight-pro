const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const financeRoutes = require("./routes/financeRoutes");
const emiRoutes = require("./routes/emiRoutes");
const insightRoutes = require("./routes/insightRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const aiRoutes = require("./routes/aiRoutes");
const anomalyRoutes = require("./routes/anomalyRoutes");
const demoRoutes = require("./routes/demoRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const { protect } = require("./middleware/authMiddleware");
const copilotRoutes = require("./routes/copilotRoutes");
const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/emi", emiRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/investment", investmentRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/anomalies", anomalyRoutes);
app.use("/api/demo", demoRoutes);
app.use("/api/receipt", receiptRoutes);
app.use("/api/copilot", copilotRoutes);
app.get("/api/test-protected", protect, (req, res) => {
  res.json({
    message: "You accessed protected route",
    user: req.user,
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, message: "Finsight Pro API running" });
});

module.exports = app;
