"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, TrendingUp, CheckCircle, Info } from "lucide-react";
import { anomalyApi, type AnomaliesResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

const TYPE_STYLES = {
  warning: {
    icon: AlertTriangle,
    wrapper: "border-warning/20 bg-warning/5",
    iconColor: "text-warning",
    badge: "bg-warning/10 text-warning border-warning/20",
  },
  info: {
    icon: Info,
    wrapper: "border-primary/20 bg-primary/5",
    iconColor: "text-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
  },
  positive: {
    icon: CheckCircle,
    wrapper: "border-success/20 bg-success/5",
    iconColor: "text-success",
    badge: "bg-success/10 text-success border-success/20",
  },
};

export function AnomalyAlertsSection() {
  const [data, setData] = useState<AnomaliesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    anomalyApi
      .get()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
<section id="anomalies" className="scroll-mt-24 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Anomaly Alerts
          </h2>
          <p className="text-xs text-muted-foreground">
            Detect unusual changes in your spending pattern
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        {loading ? (
          <div className="text-sm text-muted-foreground">
            Analyzing spending anomalies...
          </div>
        ) : !data ? (
          <div className="text-sm text-destructive">
            Failed to load anomaly analysis.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-xs text-muted-foreground">Current Month</p>
                <p className="text-lg font-semibold text-foreground">
                  ₹{data.currentMonthTotal.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-xs text-muted-foreground">Previous Month</p>
                <p className="text-lg font-semibold text-foreground">
                  ₹{data.previousMonthTotal.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.anomalies.map((item, index) => {
                const style = TYPE_STYLES[item.type];
                const Icon = style.icon;

                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-xl border p-4 flex flex-col gap-2",
                      style.wrapper
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-4 h-4", style.iconColor)} />
                        <h3 className="text-sm font-semibold text-foreground">
                          {item.title}
                        </h3>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] px-2 py-1 rounded-full border uppercase tracking-wide",
                          style.badge
                        )}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
