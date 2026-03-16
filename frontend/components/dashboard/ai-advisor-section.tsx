"use client";

import { useEffect, useState } from "react";
import { Brain, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function AIAdvisorSection() {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");

    if (!token) {
      setError("No auth token found");
      setLoading(false);
      return;
    }

    fetch(`${BASE_URL}/ai/advice`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load AI advice");
        }

        setAdvice(data.advice || "No AI advice available");
      })
      .catch((err) => {
        setError(err.message || "Failed to load AI advice");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">AI Financial Advisor</h2>
        <p className="text-xs text-muted-foreground">Personalized financial guidance</p>
      </div>

      <div className={cn(
        "bg-card border rounded-xl p-5 flex flex-col gap-4 transition-all",
        error ? "border-destructive/50 bg-destructive/5" : "border-border hover:border-primary/30"
      )}>
        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm">Analyzing your finances...</span>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">AI Recommendation</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {advice}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

