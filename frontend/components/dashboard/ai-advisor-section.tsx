"use client";

import { useEffect, useState } from "react";
import { Brain, Loader2 } from "lucide-react";

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
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
            {advice}
          </pre>
        )}
      </div>
    </section>
  );
}

