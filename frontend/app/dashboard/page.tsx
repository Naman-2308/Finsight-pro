"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  CategoryPieChart,
  MonthlyTrendChart,
} from "@/components/dashboard/analytics-charts";
import { ExpenseSection } from "@/components/dashboard/expense-section";
import { FinanceSection } from "@/components/dashboard/finance-section";
import { EMISection } from "@/components/dashboard/emi-section";
import { InsightsSection } from "@/components/dashboard/insights-section";
import { InvestmentSection } from "@/components/dashboard/investment-section";
import { AIAdvisorSection } from "@/components/dashboard/ai-advisor-section";
import { AnomalyAlertsSection } from "@/components/dashboard/anomaly-alerts-section";
import { BudgetForecast } from "@/components/dashboard/budget-forecast";
import {
  expenseApi,
  financeApi,
  emiApi,
  type ExpenseSummary,
  type ExpenseAnalytics,
  type FinanceOverview,
  type EMIOverview,
} from "@/lib/api";
import {
  ReceiptText,
  CalendarDays,
  CalendarCheck,
  CalendarRange,
  Hash,
  Wallet,
  PiggyBank,
  CreditCard,
  ShieldAlert,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [finance, setFinance] = useState<FinanceOverview | null>(null);
  const [emiOverview, setEmiOverview] = useState<EMIOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // used to force child sections to remount and refetch
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, an, fin, emi] = await Promise.allSettled([
        expenseApi.summary(),
        expenseApi.analytics(),
        financeApi.overview(),
        emiApi.overview(),
      ]);

      if (sum.status === "fulfilled") setSummary(sum.value);
      if (an.status === "fulfilled") setAnalytics(an.value);
      if (fin.status === "fulfilled") setFinance(fin.value);
      else setFinance(null);

      if (emi.status === "fulfilled") setEmiOverview(emi.value);
      else setEmiOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchDashboard();
    setRefreshKey((prev) => prev + 1);
  }, [fetchDashboard]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const riskColor =
    emiOverview?.riskLevel === "High"
      ? "text-destructive"
      : emiOverview?.riskLevel === "Moderate"
      ? "text-warning"
      : "text-success";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onMenuToggle={() => setSidebarOpen(true)}
          onRefresh={handleRefresh}
          loading={loading}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 flex flex-col gap-8">
            <div>
              <h1 className="text-xl font-bold text-foreground text-balance">
                {user ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Here&apos;s your financial snapshot for today.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <StatCard
                label="Total Expense"
                value={
                  analytics
                    ? `₹${analytics.totalExpense.toLocaleString("en-IN")}`
                    : "—"
                }
                icon={ReceiptText}
                iconColor="text-chart-5"
                loading={loading}
              />
              <StatCard
                label="Today"
                value={
                  summary ? `₹${summary.todayExpense.toLocaleString("en-IN")}` : "—"
                }
                icon={CalendarDays}
                iconColor="text-primary"
                loading={loading}
              />
              <StatCard
                label="This Week"
                value={
                  summary ? `₹${summary.weekExpense.toLocaleString("en-IN")}` : "—"
                }
                icon={CalendarCheck}
                iconColor="text-chart-2"
                loading={loading}
              />
              <StatCard
                label="This Month"
                value={
                  summary ? `₹${summary.monthExpense.toLocaleString("en-IN")}` : "—"
                }
                icon={CalendarRange}
                iconColor="text-chart-4"
                loading={loading}
              />
              <StatCard
                label="Expense Count"
                value={summary?.expenseCount ?? "—"}
                icon={Hash}
                iconColor="text-muted-foreground"
                loading={loading}
              />
              <StatCard
                label="Remaining Budget"
                value={
                  finance ? `₹${finance.remainingBudget.toLocaleString("en-IN")}` : "—"
                }
                icon={Wallet}
                iconColor="text-success"
                loading={loading}
              />
              <StatCard
                label="Est. Savings"
                value={
                  finance ? `₹${finance.estimatedSavings.toLocaleString("en-IN")}` : "—"
                }
                icon={PiggyBank}
                iconColor="text-chart-2"
                loading={loading}
              />
              <StatCard
                label="EMI Burden"
                value={emiOverview ? `${emiOverview.emiBurdenPercentage}%` : "—"}
                sub="of salary"
                icon={CreditCard}
                iconColor={riskColor}
                loading={loading}
              />
              <StatCard
                label="Risk Level"
                value={emiOverview?.riskLevel ?? "—"}
                icon={ShieldAlert}
                iconColor={riskColor}
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CategoryPieChart data={analytics} loading={loading} />
              <MonthlyTrendChart data={analytics} loading={loading} />
            </div>
            <BudgetForecast />
            <AIAdvisorSection />
            <AnomalyAlertsSection />
            <InsightsSection key={`insights-${refreshKey}`} />
            <InvestmentSection key={`investment-${refreshKey}`} />
            <ExpenseSection
              key={`expense-${refreshKey}`}
              onDataChange={handleRefresh}
            />
            <FinanceSection
              key={`finance-${refreshKey}`}
              onDataChange={handleRefresh}
            />
            <EMISection key={`emi-${refreshKey}`} onDataChange={handleRefresh} />
          </div>
        </div>
      </main>
    </div>
  );
}
