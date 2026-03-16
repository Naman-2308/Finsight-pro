"use client";

import { useState, useEffect } from "react";
import { insightsApi, type Insight } from "@/lib/api";
import { CheckCircle, AlertTriangle, ShieldAlert, PiggyBank, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const INSIGHT_CONFIG: Record<
  Insight["type"],
  { icon: typeof CheckCircle; bg: string; border: string; iconColor: string; badge: string }
> = {
  positive: {
    icon: CheckCircle,
    bg: "bg-success/5",
    border: "border-success/20",
    iconColor: "text-success",
    badge: "bg-success/10 text-success",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning/5",
    border: "border-warning/20",
    iconColor: "text-warning",
    badge: "bg-warning/10 text-warning",
  },
  danger: {
    icon: ShieldAlert,
    bg: "bg-destructive/5",
    border: "border-destructive/20",
    iconColor: "text-destructive",
    badge: "bg-destructive/10 text-destructive",
  },
  saving: {
    icon: PiggyBank,
    bg: "bg-saving/5",
    border: "border-saving/20",
    iconColor: "text-saving",
    badge: "bg-saving/10 text-saving",
  },
};

export function InsightsSection() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    insightsApi
      .get()
      .then((data) => setInsights(data.insights))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
<section id="insights" className="scroll-mt-24 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-primary" />
        <div>
          <h2 className="text-base font-semibold text-foreground">Smart Insights</h2>
          <p className="text-xs text-muted-foreground">AI-powered analysis of your finances</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-4/5 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">Could not load insights. Connect your finance data first.</p>
        </div>
      ) : insights.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center gap-3">
          <Lightbulb className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No insights available yet. Add your expenses and finance data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, idx) => {
            const config = INSIGHT_CONFIG[insight.type];
            const Icon = config.icon;
            return (
              <div
                key={idx}
                className={cn(
                  "border rounded-xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg",
                  config.bg,
                  config.border
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", `${config.bg} border ${config.border}`)}>
                    <Icon className={cn("w-4 h-4", config.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize", config.badge)}>
                        {insight.type}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
