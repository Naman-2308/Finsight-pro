"use client";

import { useEffect, useState } from "react";
import { Brain, Loader2 } from "lucide-react";

export function AIAdvisorSection() {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");

    fetch("http://localhost:5000/api/ai/advice", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setAdvice(data.advice))
      .catch(() => setAdvice("Failed to load AI advice"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">
          AI Financial Advisor
        </h2>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing your finances...
          </div>
        ) : (
          <pre className="text-sm text-foreground whitespace-pre-wrap">
            {advice}
          </pre>
        )}
      </div>
    </section>
  );
}
