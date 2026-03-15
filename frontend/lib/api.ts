const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("finsight_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Expenses ─────────────────────────────────────────────────────────────────
export interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseAnalytics {
  totalExpense: number;
  categoryBreakdown: { category: string; total: number; percentage: number }[];
  monthlyTrend: { year: number; month: number; label: string; total: number }[];
}

export interface ExpenseSummary {
  todayExpense: number;
  weekExpense: number;
  monthExpense: number;
  expenseCount: number;
}

export const expenseApi = {
  list: (filters?: ExpenseFilters) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    const qs = params.toString();
    return request<Expense[]>(`/expenses${qs ? `?${qs}` : ""}`);
  },
  create: (data: Omit<Expense, "_id">) =>
    request<Expense>("/expenses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<Expense, "_id">>) =>
    request<Expense>(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) =>
    request<{ message: string }>(`/expenses/${id}`, { method: "DELETE" }),
  analytics: () => request<ExpenseAnalytics>("/expenses/analytics"),
  summary: () => request<ExpenseSummary>("/expenses/summary"),
};

// ─── Finance ──────────────────────────────────────────────────────────────────
export interface FinanceOverview {
  monthlySalary: number;
  monthlyBudget: number;
  spentThisMonth: number;
  remainingBudget: number;
  estimatedSavings: number;
  budgetUsedPercentage: number;
}

export const financeApi = {
  setup: (data: { monthlySalary: number; monthlyBudget: number }) =>
    request<FinanceOverview>("/finance/setup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  overview: () => request<FinanceOverview>("/finance/overview"),
};

// ─── EMI ──────────────────────────────────────────────────────────────────────
export interface EMI {
  _id: string;
  name: string;
  amount: number;
  dueDate?: string;
}

export interface EMIOverview {
  totalMonthlyEMI: number;
  monthlySalary: number;
  emiBurdenPercentage: number;
  riskLevel: string;
}

export const emiApi = {
  create: (data: Omit<EMI, "_id">) =>
    request<EMI>("/emi", { method: "POST", body: JSON.stringify(data) }),
  list: () => request<EMI[]>("/emi"),
  overview: () => request<EMIOverview>("/emi/overview"),
  remove: (id: string) =>
    request<{ message: string }>(`/emi/${id}`, { method: "DELETE" }),
};

// ─── Insights ─────────────────────────────────────────────────────────────────
export interface Insight {
  type: "positive" | "warning" | "danger" | "saving";
  title: string;
  message: string;
}

export interface InsightsResponse {
  metrics: {
    monthlySalary: number;
    monthlyBudget: number;
    spentThisMonth: number;
    remainingBudget: number;
    estimatedSavings: number;
    totalMonthlyEMI: number;
    budgetUsedPercentage: number;
    emiBurdenPercentage: number;
  };
  insights: Insight[];
}

export const insightsApi = {
  get: () => request<InsightsResponse>("/insights"),
};

// ─── Investment ───────────────────────────────────────────────────────────────
export type UIRiskProfile = "Conservative" | "Moderate" | "Aggressive";
export type BackendRiskProfile = "Low" | "Moderate" | "High";

export interface InvestmentProfileResponse {
  _id: string;
  user: string;
  riskProfile: BackendRiskProfile;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestmentRecommendation {
  monthlySalary: number;
  spentThisMonth: number;
  estimatedSavings: number;
  riskProfile: BackendRiskProfile;
  recommendedAllocation: {
    sip: number;
    fd: number;
    gold: number;
  };
  advice: string;
}

export const riskProfileMap: Record<UIRiskProfile, BackendRiskProfile> = {
  Conservative: "Low",
  Moderate: "Moderate",
  Aggressive: "High",
};

export const reverseRiskProfileMap: Record<BackendRiskProfile, UIRiskProfile> = {
  Low: "Conservative",
  Moderate: "Moderate",
  High: "Aggressive",
};

export const investmentApi = {
  setProfile: (data: { riskProfile: BackendRiskProfile }) =>
    request<InvestmentProfileResponse>("/investment/profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  recommendation: () =>
    request<InvestmentRecommendation>("/investment/recommendation"),
};
export interface AnomalyItem {
  type: "warning" | "info" | "positive";
  title: string;
  message: string;
}

export interface AnomaliesResponse {
  currentMonthTotal: number;
  previousMonthTotal: number;
  anomalies: AnomalyItem[];
}

export const anomalyApi = {
  get: () => request<AnomaliesResponse>("/anomalies"),
};
export interface DemoLoadResponse {
  message: string;
  counts: {
    expenses: number;
    emis: number;
    finance: number;
    investmentProfile: number;
  };
}

export const demoApi = {
  load: () =>
    request<DemoLoadResponse>("/demo/load", {
      method: "POST",
    }),

  clear: () =>
    request<{ message: string }>("/demo/clear", {
      method: "DELETE",
    }),
};
