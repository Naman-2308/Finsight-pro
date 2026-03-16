"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, Loader2, CheckCircle } from "lucide-react";
import { financeApi, type FinanceOverview } from "@/lib/api";
import { StatCard } from "./stat-card";
import {
  IndianRupee,
  PiggyBank,
  TrendingDown,
  BadgePercent,
} from "lucide-react";

interface FinanceSectionProps {
  onDataChange?: () => void;
}

export function FinanceSection({ onDataChange }: FinanceSectionProps) {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [salary, setSalary] = useState("");
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeApi.overview();
      setOverview(data);
      setSalary(data.monthlySalary?.toString() ?? "");
      setBudget(data.monthlyBudget?.toString() ?? "");
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await financeApi.setup({
        monthlySalary: parseFloat(salary),
        monthlyBudget: parseFloat(budget),
      });

      // fetch real overview after setup, not setup response
      await fetchOverview();

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      await onDataChange?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
<section id="finance" className="scroll-mt-24 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Finance Overview
        </h2>
        <p className="text-xs text-muted-foreground">
          Manage your monthly salary and budget
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Setup Finance
            </h3>
          </div>

          <form onSubmit={handleSetup} className="flex flex-col gap-3">
            {error && (
              <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Monthly Salary (₹)
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="50000"
                required
                min="0"
                className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Monthly Budget (₹)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="30000"
                required
                min="0"
                className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : (
                "Save Finance Setup"
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Monthly Salary"
            value={
              overview
                ? `₹${overview.monthlySalary.toLocaleString("en-IN")}`
                : "—"
            }
            icon={IndianRupee}
            iconColor="text-chart-2"
            loading={loading}
          />
          <StatCard
            label="Monthly Budget"
            value={
              overview
                ? `₹${overview.monthlyBudget.toLocaleString("en-IN")}`
                : "—"
            }
            icon={Wallet}
            iconColor="text-primary"
            loading={loading}
          />
          <StatCard
            label="Spent This Month"
            value={
              overview
                ? `₹${overview.spentThisMonth.toLocaleString("en-IN")}`
                : "—"
            }
            icon={TrendingDown}
            iconColor="text-chart-5"
            loading={loading}
          />
          <StatCard
            label="Remaining Budget"
            value={
              overview
                ? `₹${overview.remainingBudget.toLocaleString("en-IN")}`
                : "—"
            }
            icon={PiggyBank}
            iconColor="text-success"
            loading={loading}
          />
          <StatCard
            label="Est. Savings"
            value={
              overview
                ? `₹${overview.estimatedSavings.toLocaleString("en-IN")}`
                : "—"
            }
            icon={PiggyBank}
            iconColor="text-chart-2"
            loading={loading}
          />
          <StatCard
            label="Budget Used"
            value={overview ? `${overview.budgetUsedPercentage.toFixed(1)}%` : "—"}
            icon={BadgePercent}
            iconColor={
              overview && overview.budgetUsedPercentage > 80
                ? "text-destructive"
                : overview && overview.budgetUsedPercentage > 50
                ? "text-warning"
                : "text-success"
            }
            loading={loading}
          />
        </div>
      </div>
    </section>
  );
}
