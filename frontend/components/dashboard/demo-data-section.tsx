"use client";

import { useEffect, useState } from "react";
import { Database, Loader2, Trash2, Sparkles } from "lucide-react";
import { demoApi, type DemoStatusResponse } from "@/lib/api";

interface DemoDataSectionProps {
  onDataChange?: () => void | Promise<void>;
}

export function DemoDataSection({ onDataChange }: DemoDataSectionProps) {
  const [status, setStatus] = useState<DemoStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchStatus() {
    setLoadingStatus(true);
    try {
      const res = await demoApi.status();
      setStatus(res);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function handleLoadDemo() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await demoApi.load();
      setMessage(res.message);
      await onDataChange?.();
      await fetchStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load demo data");
    } finally {
      setLoading(false);
    }
  }

  async function handleClearDemo() {
    setClearing(true);
    setError("");
    setMessage("");

    try {
      const res = await demoApi.clear();
      setMessage(res.message);
      await onDataChange?.();
      await fetchStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to clear demo data");
    } finally {
      setClearing(false);
    }
  }

  if (loadingStatus) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Demo Data Mode
            </h2>
            <p className="text-xs text-muted-foreground">
              Checking account state...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!status) return null;

  // Hide demo section completely if user has real data
  if (status.hasRealData && !status.hasDemoData) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-primary" />
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Demo Data Mode
          </h2>
          <p className="text-xs text-muted-foreground">
            Explore the dashboard safely with sample data
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
        {!status.hasDemoData && status.canLoadDemo && (
          <>
            <div className="text-sm text-muted-foreground">
              Your account is empty. You can load sample financial data to explore
              the product experience.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLoadDemo}
                disabled={loading || clearing}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Load Demo Data
              </button>
            </div>
          </>
        )}

        {status.hasDemoData && (
          <>
            <div className="text-sm text-muted-foreground">
              Demo data is currently active on this account. You can clear only the
              demo-tagged records below.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleClearDemo}
                disabled={loading || clearing}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-all disabled:opacity-60"
              >
                {clearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Clear Demo Data
              </button>
            </div>
          </>
        )}

        {message && (
          <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="text-xs text-muted-foreground leading-relaxed">
          Demo mode no longer overwrites real user data. It is available only for
          new accounts and clears only demo-tagged records.
        </div>
      </div>
    </section>
  );
}
