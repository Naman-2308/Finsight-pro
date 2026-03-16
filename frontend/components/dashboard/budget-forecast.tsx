"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Loader2,
  AlertCircle,
  Calendar,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ForecastData {
  dailyAverage: number;
  projectedMonthlyExpense: number;
  budget?: number;
  daysUntilBudgetExceeded: number | null;
}

export function BudgetForecast() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");

    if (!token) {
      setError("No auth token found");
      setLoading(false);
      return;
    }

    fetch(`${BASE_URL}/prediction`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Failed to load forecast");
        }

        setData(json);
      })
      .catch((err) => {
        setError(err.message || "Failed to load forecast");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
<section id="forecast" className="scroll-mt-24 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            Budget Forecast
          </h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <Loader2 className="animate-spin w-5 h-5 text-primary" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
<section id="forecast" className="scroll-mt-24 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Budget Forecast
          </h2>
          <p className="text-xs text-muted-foreground">
            AI-powered spending predictions
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-sm text-destructive">
          {error}
        </div>
      </section>
    );
  }

  const hasWarning =
    data?.daysUntilBudgetExceeded !== null &&
    data?.daysUntilBudgetExceeded !== undefined;

  const isUrgent =
    data?.daysUntilBudgetExceeded !== null &&
    data?.daysUntilBudgetExceeded !== undefined &&
    data.daysUntilBudgetExceeded <= 7;

  return (
<section id="forecast" className="scroll-mt-24 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Budget Forecast
        </h2>
        <p className="text-xs text-muted-foreground">
          AI-powered spending predictions
        </p>
      </div>

      <div
        className={cn(
          "bg-card border rounded-xl p-5 flex flex-col gap-4 hover:border-primary/30 transition-all",
          hasWarning && isUrgent ? "border-destructive/50 bg-destructive/5" : "border-border"
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Daily Average
              </p>
              <p className="text-lg font-bold text-foreground break-words">
                ₹{Number(data?.dailyAverage ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">per day</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div className="w-8 h-8 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-chart-2" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Projected Monthly
              </p>
              <p className="text-lg font-bold text-foreground break-words">
                ₹
                {Number(data?.projectedMonthlyExpense ?? 0).toLocaleString(
                  "en-IN"
                )}
              </p>
              <p className="text-xs text-muted-foreground">forecast</p>
            </div>
          </div>
        </div>

        {hasWarning && (
          <div
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border",
              isUrgent
                ? "bg-destructive/10 border-destructive/30"
                : "bg-warning/10 border-warning/30"
            )}
          >
            <AlertCircle
              className={cn(
                "w-4 h-4 flex-shrink-0 mt-0.5",
                isUrgent ? "text-destructive" : "text-warning"
              )}
            />
            <div className="flex flex-col gap-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  isUrgent ? "text-destructive" : "text-warning"
                )}
              >
                {isUrgent ? "Budget Alert!" : "Budget Warning"}
              </p>
              <p
                className={cn(
                  "text-xs",
                  isUrgent ? "text-destructive/90" : "text-warning/90"
                )}
              >
                At your current spending rate, you'll exceed your budget in{" "}
                <span className="font-bold">
                  {data?.daysUntilBudgetExceeded} day
                  {data?.daysUntilBudgetExceeded !== 1 ? "s" : ""}
                </span>
                . Consider reducing daily expenses.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
