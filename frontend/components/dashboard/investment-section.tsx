"use client";

import { useState, useEffect } from "react";
import {
  investmentApi,
  type UIRiskProfile,
  type InvestmentRecommendation,
  riskProfileMap,
  reverseRiskProfileMap,
} from "@/lib/api";
import { TrendingUp, BarChart3, Landmark, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const RISK_OPTIONS: UIRiskProfile[] = ["Conservative", "Moderate", "Aggressive"];

const RISK_COLORS: Record<UIRiskProfile, string> = {
  Conservative: "text-success border-success/30 bg-success/10",
  Moderate: "text-warning border-warning/30 bg-warning/10",
  Aggressive: "text-destructive border-destructive/30 bg-destructive/10",
};

const ALLOCATION_ICONS = {
  sip: BarChart3,
  fd: Landmark,
  gold: Coins,
};

const ALLOCATION_LABELS = {
  sip: "SIP (Mutual Fund)",
  fd: "Fixed Deposit",
  gold: "Gold",
};

const ALLOCATION_COLORS = {
  sip: "text-primary bg-primary/10",
  fd: "text-chart-2 bg-chart-2/10",
  gold: "text-warning bg-warning/10",
};

export function InvestmentSection() {
  const [riskProfile, setRiskProfile] = useState<UIRiskProfile>("Moderate");
  const [recommendation, setRecommendation] =
    useState<InvestmentRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    investmentApi
      .recommendation()
      .then((data) => {
        setRecommendation(data);
        setRiskProfile(reverseRiskProfileMap[data.riskProfile]);
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  async function handleSetProfile(profile: UIRiskProfile) {
    setRiskProfile(profile);
    setError("");
    setLoading(true);

    try {
      await investmentApi.setProfile({
        riskProfile: riskProfileMap[profile],
      });

      const data = await investmentApi.recommendation();
      setRecommendation(data);
      setRiskProfile(reverseRiskProfileMap[data.riskProfile]);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch recommendations"
      );
    } finally {
      setLoading(false);
    }
  }

  const totalSavings = recommendation?.estimatedSavings ?? 0;

  return (
    <section id="investments" className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Investment Recommendations
          </h2>
          <p className="text-xs text-muted-foreground">
            AI-suggested allocations based on your profile
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2.5">
              Select your risk profile
            </p>
            <div className="flex gap-2 flex-wrap">
              {RISK_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSetProfile(option)}
                  disabled={loading}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                    riskProfile === option
                      ? RISK_COLORS[option]
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          {initialLoading || loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-muted rounded-xl h-28" />
              ))}
            </div>
          ) : recommendation ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Est. Savings Available
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    ₹{recommendation.estimatedSavings.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["sip", "fd", "gold"] as const).map((type) => {
                  const Icon = ALLOCATION_ICONS[type];
                  const alloc = recommendation.recommendedAllocation[type];
                  const pct =
                    totalSavings > 0
                      ? ((alloc / totalSavings) * 100).toFixed(0)
                      : "0";

                  return (
                    <div
                      key={type}
                      className="bg-background border border-border rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            ALLOCATION_COLORS[type]
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {ALLOCATION_LABELS[type]}
                        </span>
                      </div>

                      <div>
                        <p className="text-xl font-bold text-foreground">
                          ₹{alloc.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pct}% of savings
                        </p>
                      </div>

                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            {
                              "bg-primary": type === "sip",
                              "bg-chart-2": type === "fd",
                              "bg-warning": type === "gold",
                            }
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {recommendation.advice && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/15">
                  <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed">
                    {recommendation.advice}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Select a risk profile to see recommendations
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
