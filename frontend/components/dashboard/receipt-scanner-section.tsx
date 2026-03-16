"use client";

import { useMemo, useState } from "react";
import {
  Camera,
  Loader2,
  ScanLine,
  CheckCircle2,
  Image as ImageIcon,
  Save,
  PencilLine,
} from "lucide-react";
import {
  scanReceipt,
  saveScannedReceipt,
  type ScannedReceiptBill,
  type ScannedReceiptItem,
  type ReceiptCategory,
} from "@/lib/receipt-api";

interface ReceiptScannerSectionProps {
  onDataChange?: () => void | Promise<void>;
}

const CATEGORY_OPTIONS: ReceiptCategory[] = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Travel",
  "Other",
];

export function ReceiptScannerSection({
  onDataChange,
}: ReceiptScannerSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [bills, setBills] = useState<ScannedReceiptBill[]>([]);
  const [mode, setMode] = useState<"billTotals" | "lineItems">("billTotals");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleFileChange(selected: File | null) {
    setFile(selected);
    setBills([]);
    setMessage("");
    setError("");

    if (selected) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
  }

  async function handleScan() {
    if (!file) {
      setError("Please choose a receipt image first");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setBills([]);

    try {
      const res = await scanReceipt(file);
      setBills(res.extracted.bills || []);
      setMessage("Receipt scanned successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Receipt scan failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!bills.length) {
      setError("Nothing to save");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await saveScannedReceipt({
        mode,
        bills,
      });

      setMessage(
        `${res.message} (${res.createdCount} expense${
          res.createdCount > 1 ? "s" : ""
        } created)`
      );

      await onDataChange?.();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to save scanned receipt"
      );
    } finally {
      setSaving(false);
    }
  }

  const itemCount = useMemo(
    () => bills.reduce((sum, bill) => sum + (bill.items?.length || 0), 0),
    [bills]
  );

  function updateBillField<K extends keyof ScannedReceiptBill>(
    billIndex: number,
    field: K,
    value: ScannedReceiptBill[K]
  ) {
    setBills((prev) =>
      prev.map((bill, index) =>
        index === billIndex ? { ...bill, [field]: value } : bill
      )
    );
  }

  function updateItemField<K extends keyof ScannedReceiptItem>(
    billIndex: number,
    itemIndex: number,
    field: K,
    value: ScannedReceiptItem[K]
  ) {
    setBills((prev) =>
      prev.map((bill, bIndex) => {
        if (bIndex !== billIndex) return bill;

        return {
          ...bill,
          items: bill.items.map((item, iIndex) =>
            iIndex === itemIndex ? { ...item, [field]: value } : item
          ),
        };
      })
    );
  }

  return (
<section id="receipt-scanner" className="scroll-mt-24 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ScanLine className="w-4 h-4 text-primary" />
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Receipt Scanner
          </h2>
          <p className="text-xs text-muted-foreground">
            Scan one or multiple bills in a single image and save totals or line items
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-all cursor-pointer">
                <Camera className="w-4 h-4" />
                Choose Receipt Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </label>

              <button
                onClick={handleScan}
                disabled={loading || !file}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ScanLine className="w-4 h-4" />
                )}
                Scan Receipt
              </button>
            </div>

            {file && (
              <div className="text-xs text-muted-foreground">
                Selected file: {file.name}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <div className="w-full lg:w-72 shrink-0">
            <div className="rounded-xl border border-border bg-background p-3 h-full">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Preview
              </div>

              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="w-full rounded-lg border border-border object-cover max-h-80"
                />
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                  No image selected
                </div>
              )}
            </div>
          </div>
        </div>

        {bills.length > 0 && (
          <>
            <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Scan Result
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bills.length} bill{bills.length > 1 ? "s" : ""} detected •{" "}
                    {itemCount} line item{itemCount !== 1 ? "s" : ""} detected
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode("billTotals")}
                      className={`px-3 py-2 rounded-lg text-sm border ${
                        mode === "billTotals"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      Save Bill Totals
                    </button>
                    <button
                      onClick={() => setMode("lineItems")}
                      className={`px-3 py-2 rounded-lg text-sm border ${
                        mode === "lineItems"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      Save All Line Items
                    </button>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Extracted Data
                  </button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Current mode:</span>{" "}
                {mode === "billTotals"
                  ? "one expense per bill using total amount"
                  : "one expense per line item across all detected bills"}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {bills.map((bill, billIndex) => (
                <div
                  key={billIndex}
                  className="rounded-xl border border-border bg-background p-4 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-2">
                    <PencilLine className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Bill {billIndex + 1}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Merchant
                      </label>
                      <input
                        value={bill.merchant}
                        onChange={(e) =>
                          updateBillField(billIndex, "merchant", e.target.value)
                        }
                        className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">
                        Title
                      </label>
                      <input
                        value={bill.title}
                        onChange={(e) =>
                          updateBillField(billIndex, "title", e.target.value)
                        }
                        className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">
                        Total Amount
                      </label>
                      <input
                        type="number"
                        value={bill.totalAmount}
                        onChange={(e) =>
                          updateBillField(
                            billIndex,
                            "totalAmount",
                            Number(e.target.value)
                          )
                        }
                        className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">
                        Category
                      </label>
                      <select
                        value={bill.category}
                        onChange={(e) =>
                          updateBillField(
                            billIndex,
                            "category",
                            e.target.value as ReceiptCategory
                          )
                        }
                        className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                      >
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">
                        Date
                      </label>
                      <input
                        type="date"
                        value={bill.date}
                        onChange={(e) =>
                          updateBillField(billIndex, "date", e.target.value)
                        }
                        className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">
                        Notes
                      </label>
                      <input
                        value={bill.notes}
                        onChange={(e) =>
                          updateBillField(billIndex, "notes", e.target.value)
                        }
                        className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="text-sm font-medium text-foreground">
                      Line Items ({bill.items.length})
                    </div>

                    {bill.items.length === 0 ? (
                      <div className="text-xs text-muted-foreground">
                        No readable line items detected for this bill.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {bill.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-border p-3"
                          >
                            <div>
                              <label className="text-xs text-muted-foreground">
                                Item Name
                              </label>
                              <input
                                value={item.name}
                                onChange={(e) =>
                                  updateItemField(
                                    billIndex,
                                    itemIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-muted-foreground">
                                Amount
                              </label>
                              <input
                                type="number"
                                value={item.amount}
                                onChange={(e) =>
                                  updateItemField(
                                    billIndex,
                                    itemIndex,
                                    "amount",
                                    Number(e.target.value)
                                  )
                                }
                                className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-muted-foreground">
                                Category
                              </label>
                              <select
                                value={item.category}
                                onChange={(e) =>
                                  updateItemField(
                                    billIndex,
                                    itemIndex,
                                    "category",
                                    e.target.value as ReceiptCategory
                                  )
                                }
                                className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                              >
                                {CATEGORY_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
