"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";

interface CategoryBreakdownItem {
  category: string;
  total: number;
  percentage: number;
}

interface MonthlyTrendItem {
  year: number;
  month: number;
  label: string;
  total: number;
}

interface ExpenseAnalytics {
  totalExpense: number;
  categoryBreakdown: CategoryBreakdownItem[];
  monthlyTrend: MonthlyTrendItem[];
}

interface ChartProps {
  data: ExpenseAnalytics | null;
  loading?: boolean;
}

const PIE_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
];

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-xl bg-background/40">
      {text}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-[280px] rounded-xl bg-muted animate-pulse" />
  );
}

export function CategoryPieChart({ data, loading }: ChartProps) {
  const chartData = data?.categoryBreakdown || [];

  return (
    <section className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <PieChartIcon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Category Breakdown
          </h2>
          <p className="text-xs text-muted-foreground">
            Spending split by category
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : !chartData.length ? (
        <EmptyState text="No category data available yet." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 items-center">
          <div className="h-[280px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.category}-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2">
            {chartData.map((item, index) => (
              <div
                key={item.category}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="text-sm text-foreground truncate">
                    {item.category}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(item.total)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.percentage}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function MonthlyTrendChart({ data, loading }: ChartProps) {
  const chartData = data?.monthlyTrend || [];

  return (
    <section className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Monthly Trend
          </h2>
          <p className="text-xs text-muted-foreground">
            Expense progression over time
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : !chartData.length ? (
        <EmptyState text="No monthly trend data available yet." />
      ) : (
        <div className="h-[280px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => `₹${value}`}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="total"
                radius={[10, 10, 0, 0]}
                fill="#6366f1"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
