"use client";

import { Sparkles, PlusCircle, Wallet } from "lucide-react";

interface Props {
  onAddExpense?: () => void;
  onSetupFinance?: () => void;
  onLoadDemo?: () => void;
}

export function OnboardingSection({
  onAddExpense,
  onSetupFinance,
  onLoadDemo,
}: Props) {
  return (
    <section className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Welcome to FinSight Pro</h2>
        <p className="text-sm text-muted-foreground">
          Your dashboard is empty. Start managing your finances by adding real
          data or exploring the app with demo data.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onAddExpense}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          Add First Expense
        </button>

        <button
          onClick={onSetupFinance}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm"
        >
          <Wallet className="w-4 h-4" />
          Setup Finance
        </button>

        <button
          onClick={onLoadDemo}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm"
        >
          <Sparkles className="w-4 h-4" />
          Try Demo Data
        </button>
      </div>
    </section>
  );
}
