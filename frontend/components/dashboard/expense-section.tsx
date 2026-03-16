"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Pencil, Trash2, Filter, X, Receipt } from "lucide-react";
import { expenseApi, type Expense, type ExpenseFilters } from "@/lib/api";
import { ExpenseModal } from "./expense-modal";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Education",
  "Other",
];

interface ExpenseSectionProps {
  onDataChange?: () => void;
}

export function ExpenseSection({ onDataChange }: ExpenseSectionProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await expenseApi.list(filters);
      setExpenses(data);
      setVisibleCount(10);
    } catch {
      setExpenses([]);
      setVisibleCount(10);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  async function handleCreate(data: Omit<Expense, "_id">) {
    await expenseApi.create(data);
    await fetchExpenses();
    onDataChange?.();
  }

  async function handleUpdate(data: Omit<Expense, "_id">) {
    if (!editExpense) return;
    await expenseApi.update(editExpense._id, data);
    await fetchExpenses();
    onDataChange?.();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await expenseApi.remove(id);
      const updatedExpenses = expenses.filter((e) => e._id !== id);
      setExpenses(updatedExpenses);

      if (visibleCount > updatedExpenses.length && updatedExpenses.length >= 10) {
        setVisibleCount(updatedExpenses.length);
      }

      onDataChange?.();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setFilters({});
    setShowFilters(false);
  }

  const hasFilters = Object.values(filters).some(Boolean);
  const visibleExpenses = expenses.slice(0, visibleCount);
  const hasMoreExpenses = expenses.length > visibleCount;
  const canShowLess = expenses.length > 10 && visibleCount > 10;

  return (
    <section id="expenses" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Expenses</h2>
          <p className="text-xs text-muted-foreground">{expenses.length} records</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all",
              hasFilters
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasFilters && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setEditExpense(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Category
            </label>
            <select
              value={filters.category ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  category: e.target.value || undefined,
                }))
              }
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  startDate: e.target.value || undefined,
                }))
              }
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  endDate: e.target.value || undefined,
                }))
              }
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="flex-1 h-4 bg-muted rounded" />
                <div className="w-20 h-4 bg-muted rounded" />
                <div className="w-20 h-4 bg-muted rounded" />
                <div className="w-20 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Receipt className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No expenses found
            </p>
            <p className="text-xs text-muted-foreground/60">
              {hasFilters
                ? "Try adjusting your filters"
                : "Add your first expense to get started"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {visibleExpenses.map((expense, idx) => (
                    <tr
                      key={expense._id}
                      className={cn(
                        "hover:bg-accent/40 transition-colors",
                        idx !== visibleExpenses.length - 1 &&
                          "border-b border-border/50"
                      )}
                    >
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        {expense.title}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          {expense.category}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                        ₹{expense.amount.toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditExpense(expense);
                              setShowModal(true);
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                            aria-label="Edit expense"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(expense._id)}
                            disabled={deletingId === expense._id}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {expenses.length > 10 && (
              <div className="flex flex-col items-center gap-3 px-4 py-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {Math.min(visibleCount, expenses.length)} of{" "}
                  {expenses.length} expenses
                </p>

                <div className="flex items-center gap-3">
                  {hasMoreExpenses && (
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-all"
                    >
                      Show More
                    </button>
                  )}

                  {canShowLess && (
                    <button
                      onClick={() => setVisibleCount(10)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    >
                      Show Less
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <ExpenseModal
          expense={editExpense}
          onClose={() => {
            setShowModal(false);
            setEditExpense(null);
          }}
          onSubmit={editExpense ? handleUpdate : handleCreate}
        />
      )}
    </section>
  );
}
