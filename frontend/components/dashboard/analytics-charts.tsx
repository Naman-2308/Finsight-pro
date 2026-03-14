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
  LineChart,
  Line,
} from "recharts";
import type { ExpenseAnalytics } from "@/lib/api";

const COLORS = [
  "oklch(0.62 0.19 250)",
  "oklch(0.68 0.17 165)",
  "oklch(0.74 0.18 85)",
  "oklch(0.66 0.22 300)",
  "oklch(0.60 0.22 20)",
  "oklch(0.72 0.15 195)",
  "oklch(0.64 0.20 45)",
];

const tooltipStyle = {
  backgroundColor: "oklch(0.14 0 0)",
  border: "1px solid oklch(0.22 0 0)",
  borderRadius: "8px",
  color: "oklch(0.94 0 0)",
  fontSize: "12px",
};

interface AnalyticsChartsProps {
  data: ExpenseAnalytics | null;
  loading?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse h-full bg-muted/30 rounded-lg" />
  );
}

export function CategoryPieChart({ data, loading }: AnalyticsChartsProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Category Breakdown</h3>
      {loading ? (
        <div className="h-56">
          <LoadingSkeleton />
        </div>
      ) : !data || data.categoryBreakdown.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.categoryBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="total"
                nameKey="category"
              >
                {data.categoryBreakdown.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2">
            {data.categoryBreakdown.map((item, index) => (
              <div key={item.category} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-muted-foreground truncate">{item.category}</span>
                <span className="text-xs font-medium text-foreground ml-auto">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MonthlyTrendChart({ data, loading }: AnalyticsChartsProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Trend</h3>
      {loading ? (
        <div className="h-56">
          <LoadingSkeleton />
        </div>
      ) : !data || data.monthlyTrend.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          {data.monthlyTrend.length <= 2 ? (
            <BarChart data={data.monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "oklch(0.55 0 0)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "oklch(0.55 0 0)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Expenses"]}
              />
              <Bar dataKey="total" fill="oklch(0.62 0.19 250)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data.monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "oklch(0.55 0 0)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "oklch(0.55 0 0)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Expenses"]}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="oklch(0.62 0.19 250)"
                strokeWidth={2}
                dot={{ fill: "oklch(0.62 0.19 250)", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
