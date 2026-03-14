"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  CreditCard,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import { emiApi, type EMI, type EMIOverview } from "@/lib/api";
import { StatCard } from "./stat-card";
import { cn } from "@/lib/utils";

const RISK_CONFIG: Record<
  string,
  { color: string; icon: typeof CheckCircle; label: string }
> = {
  Low: { color: "text-success", icon: CheckCircle, label: "Low Risk" },
  Moderate: {
    color: "text-warning",
    icon: AlertTriangle,
    label: "Moderate Risk",
  },
  High: { color: "text-destructive", icon: ShieldAlert, label: "High Risk" },
};

interface EMISectionProps {
  onDataChange?: () => void;
}

export function EMISection({ onDataChange }: EMISectionProps) {
  const [emis, setEmis] = useState<EMI[]>([]);
  const [overview, setOverview] = useState<EMIOverview | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [remainingMonths, setRemainingMonths] = useState("");
  const [interestRate, setInterestRate] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoadingList(true);
    setLoadingOverview(true);

    try {
      const [list, ov] = await Promise.all([emiApi.list(), emiApi.overview()]);
      setEmis(list);
      setOverview(ov);
    } catch {
      setEmis([]);
      setOverview(null);
    } finally {
      setLoadingList(false);
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleAddEMI(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      await emiApi.create({
        title,
        monthlyAmount: parseFloat(monthlyAmount),
        remainingMonths: parseInt(remainingMonths, 10),
        interestRate: interestRate ? parseFloat(interestRate) : 0,
      });

      setTitle("");
      setMonthlyAmount("");
      setRemainingMonths("");
      setInterestRate("");
      setShowForm(false);

      await fetchAll();
      onDataChange?.();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to add EMI");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await emiApi.remove(id);
      setEmis((prev) => prev.filter((e) => e._id !== id));
      emiApi.overview().then(setOverview).catch(() => {});
      onDataChange?.();
    } finally {
      setDeletingId(null);
    }
  }

  const riskInfo = overview
    ? RISK_CONFIG[overview.riskLevel] ?? RISK_CONFIG.Low
    : null;

  return (
    <section id="emi" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            EMI Overview
          </h2>
          <p className="text-xs text-muted-foreground">
            Track your loan repayments
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add EMI</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Total Monthly EMI"
          value={
            overview
              ? `₹${overview.totalMonthlyEMI.toLocaleString("en-IN")}`
              : "—"
          }
          icon={CreditCard}
          iconColor="text-chart-4"
          loading={loadingOverview}
        />

        <StatCard
          label="EMI Burden"
          value={overview ? `${overview.emiBurdenPercentage}%` : "—"}
          sub="of monthly salary"
          icon={CreditCard}
          iconColor={
            overview && overview.emiBurdenPercentage > 40
              ? "text-destructive"
              : overview && overview.emiBurdenPercentage > 20
              ? "text-warning"
              : "text-success"
          }
          loading={loadingOverview}
        />

        <div
          className={cn(
            "bg-card border border-border rounded-xl p-5 flex flex-col gap-3",
            loadingOverview && "animate-pulse"
          )}
        >
          {loadingOverview ? (
            <>
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-7 w-20 bg-muted rounded" />
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Risk Level
              </span>
              {riskInfo && overview && (
                <div className={cn("flex items-center gap-2", riskInfo.color)}>
                  <riskInfo.icon className="w-5 h-5" />
                  <span className="text-2xl font-bold">{riskInfo.label}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Add New EMI
          </h3>

          <form
            onSubmit={handleAddEMI}
            className="flex flex-wrap gap-3 items-end"
          >
            {formError && (
              <div className="w-full px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-1.5 flex-1 min-w-40">
              <label className="text-xs font-medium text-muted-foreground">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Home Loan"
                required
                className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-40">
              <label className="text-xs font-medium text-muted-foreground">
                Monthly Amount (₹)
              </label>
              <input
                type="number"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                placeholder="5000"
                required
                min="0"
                className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-36">
              <label className="text-xs font-medium text-muted-foreground">
                Remaining Months
              </label>
              <input
                type="number"
                value={remainingMonths}
                onChange={(e) => setRemainingMonths(e.target.value)}
                placeholder="12"
                required
                min="1"
                className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-32">
              <label className="text-xs font-medium text-muted-foreground">
                Interest %
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="10"
                min="0"
                step="0.1"
                className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add
            </button>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loadingList ? (
          <div className="p-6 flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="flex-1 h-4 bg-muted rounded" />
                <div className="w-24 h-4 bg-muted rounded" />
                <div className="w-24 h-4 bg-muted rounded" />
                <div className="w-20 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : emis.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No EMIs added yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Monthly
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Remaining
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Interest
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {emis.map((emi, idx) => (
                <tr
                  key={emi._id}
                  className={cn(
                    "hover:bg-accent/40 transition-colors",
                    idx !== emis.length - 1 && "border-b border-border/50"
                  )}
                >
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {emi.title}
                  </td>

                  <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                    ₹{emi.monthlyAmount.toLocaleString("en-IN")}
                  </td>

                  <td className="px-5 py-3.5 text-right text-muted-foreground hidden sm:table-cell">
                    {emi.remainingMonths} mo
                  </td>

                  <td className="px-5 py-3.5 text-right text-muted-foreground hidden md:table-cell">
                    {emi.interestRate}%
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(emi._id)}
                      disabled={deletingId === emi._id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                      aria-label="Delete EMI"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
