const Emi = require("../models/Emi");
const Finance = require("../models/Finance");
const mongoose = require("mongoose");

// ================================
// CREATE EMI
// ================================
const createEmi = async (req, res) => {
  try {
    const { title, monthlyAmount, remainingMonths, interestRate } = req.body;

    if (!title || !monthlyAmount || !remainingMonths) {
      return res.status(400).json({
        message: "title, monthlyAmount and remainingMonths are required",
      });
    }

    const emi = await Emi.create({
      user: req.user._id,
      title,
      monthlyAmount: Number(monthlyAmount),
      remainingMonths: Number(remainingMonths),
      interestRate: interestRate ? Number(interestRate) : 0,
    });

    res.status(201).json(emi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// GET ALL EMI
// ================================
const getEmis = async (req, res) => {
  try {
    const emis = await Emi.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(emis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// DELETE EMI
// ================================
const deleteEmi = async (req, res) => {
  try {
    const emi = await Emi.findById(req.params.id);

    if (!emi) {
      return res.status(404).json({ message: "EMI not found" });
    }

    if (emi.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await emi.deleteOne();

    res.json({ message: "EMI removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================================
// EMI OVERVIEW
// ================================
const getEmiOverview = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const emiResult = await Emi.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalMonthlyEMI: { $sum: "$monthlyAmount" },
        },
      },
    ]);

    const totalMonthlyEMI = emiResult[0]?.totalMonthlyEMI || 0;

    const finance = await Finance.findOne({ user: req.user._id });

    const monthlySalary = finance?.monthlySalary || 0;

    const emiBurdenPercentage =
      monthlySalary > 0
        ? Number(((totalMonthlyEMI / monthlySalary) * 100).toFixed(2))
        : 0;

    let riskLevel = "Low";
    if (emiBurdenPercentage >= 40) {
      riskLevel = "High";
    } else if (emiBurdenPercentage >= 20) {
      riskLevel = "Moderate";
    }

    res.json({
      totalMonthlyEMI,
      monthlySalary,
      emiBurdenPercentage,
      riskLevel,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEmi,
  getEmis,
  deleteEmi,
  getEmiOverview,
};
