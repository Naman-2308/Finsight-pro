require("express-async-errors");

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
const copilotRoutes = require("./routes/copilotRoutes");
const { protect } = require("./middleware/authMiddleware");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Finsight Pro API running",
  });
});

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
  res.status(200).json({
    message: "You accessed protected route",
    user: req.user,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Something went wrong",
  });
});

module.exports = app;