const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("finsight_token");
}

export type ReceiptCategory =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Bills"
  | "Entertainment"
  | "Health"
  | "Education"
  | "Travel"
  | "Other";

export interface ScannedReceiptItem {
  name: string;
  amount: number;
  category: ReceiptCategory;
}

export interface ScannedReceiptBill {
  merchant: string;
  title: string;
  totalAmount: number;
  category: ReceiptCategory;
  date: string;
  notes: string;
  items: ScannedReceiptItem[];
}

export interface ScanReceiptResponse {
  message: string;
  extracted: {
    bills: ScannedReceiptBill[];
    raw?: string;
  };
}

export interface SaveReceiptResponse {
  message: string;
  mode: "billTotals" | "lineItems";
  createdCount: number;
  expenses: unknown[];
}

export async function scanReceipt(file: File): Promise<ScanReceiptResponse> {
  const token = getToken();
  const formData = new FormData();
  formData.append("receipt", file);

  const res = await fetch(`${BASE_URL}/receipt/scan`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Receipt scan failed");
  }

  return data;
}

export async function saveScannedReceipt(payload: {
  mode: "billTotals" | "lineItems";
  bills: ScannedReceiptBill[];
}): Promise<SaveReceiptResponse> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}/receipt/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to save scanned receipt");
  }

  return data;
}
