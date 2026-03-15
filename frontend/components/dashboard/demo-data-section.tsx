"use client";

import { useState } from "react";
import { Database, Loader2, Trash2, Sparkles } from "lucide-react";
import { demoApi } from "@/lib/api";

interface DemoDataSectionProps {
  onDataChange?: () => void | Promise<void>;
}

export function DemoDataSection({ onDataChange }: DemoDataSectionProps) {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleLoadDemo() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await demoApi.load();
      setMessage(res.message);
      await onDataChange?.();
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to clear demo data");
    } finally {
      setClearing(false);
    }
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
            Instantly populate the dashboard for demos and presentations
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
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
          Demo mode will seed finance setup, EMI entries, investment profile,
          and multiple expenses across categories and months for a rich dashboard experience.
        </div>
      </div>
    </section>
  );
}
