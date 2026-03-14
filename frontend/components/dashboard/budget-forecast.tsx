"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Loader2 } from "lucide-react";

export function BudgetForecast() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");

    fetch("http://localhost:5000/api/prediction", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold">Budget Forecast</h2>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <p className="text-sm">
              Daily average spend: ₹{data?.dailyAverage}
            </p>

            <p className="text-sm">
              Projected monthly spend: ₹{data?.projectedMonthlyExpense}
            </p>

            {data?.daysUntilBudgetExceeded !== null && (
              <p className="text-sm text-destructive font-medium mt-2">
                ⚠️ At this rate you will exceed budget in{" "}
                {data.daysUntilBudgetExceeded} days
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
