import type {
  Category,
  CurrencyCode,
  PaymentMethod,
  RecurrenceFrequency,
} from "./types";

export const INCOME_CATEGORIES: Category[] = [
  { id: "salaire", label: "Salaire", type: "income", icon: "banknote", color: "#6366f1" },
  { id: "business", label: "Business", type: "income", icon: "briefcase", color: "#0ea5e9" },
  { id: "freelance", label: "Freelance", type: "income", icon: "laptop", color: "#14b8a6" },
  { id: "investissements", label: "Investissements", type: "income", icon: "trending-up", color: "#22c55e" },
  { id: "autres-revenus", label: "Autres revenus", type: "income", icon: "circle-dollar", color: "#a855f7" },
];

export const EXPENSE_CATEGORIES: Category[] = [
  { id: "nourriture", label: "Nourriture", type: "expense", icon: "utensils", color: "#f97316" },
  { id: "transport", label: "Transport", type: "expense", icon: "car", color: "#3b82f6" },
  { id: "logement", label: "Logement", type: "expense", icon: "home", color: "#8b5cf6" },
  { id: "internet", label: "Internet", type: "expense", icon: "wifi", color: "#06b6d4" },
  { id: "sante", label: "Santé", type: "expense", icon: "heart-pulse", color: "#ef4444" },
  { id: "loisirs", label: "Loisirs", type: "expense", icon: "gamepad", color: "#ec4899" },
  { id: "business-exp", label: "Business", type: "expense", icon: "briefcase", color: "#64748b" },
  { id: "abonnements", label: "Abonnements", type: "expense", icon: "repeat", color: "#eab308" },
  { id: "autres-depenses", label: "Autres", type: "expense", icon: "package", color: "#94a3b8" },
];

export const ALL_CATEGORIES: Category[] = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const CATEGORY_MAP = new Map(ALL_CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category | undefined {
  return CATEGORY_MAP.get(id);
}

export function categoriesFor(type: "income" | "expense"): Category[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "card", label: "Carte bancaire" },
  { id: "cash", label: "Espèces" },
  { id: "transfer", label: "Virement" },
  { id: "check", label: "Chèque" },
  { id: "mobile", label: "Paiement mobile" },
  { id: "other", label: "Autre" },
];

const PAYMENT_MAP = new Map(PAYMENT_METHODS.map((p) => [p.id, p.label]));

export function paymentLabel(id: PaymentMethod): string {
  return PAYMENT_MAP.get(id) ?? "Autre";
}

export const RECURRENCE_OPTIONS: { id: RecurrenceFrequency; label: string }[] = [
  { id: "monthly", label: "Tous les mois" },
  { id: "weekly", label: "Toutes les semaines" },
];

export function recurrenceLabel(id: RecurrenceFrequency): string {
  return id === "weekly" ? "Hebdomadaire" : "Mensuelle";
}

/** Palette for savings goals. */
export const GOAL_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#eab308",
];

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "USD", label: "Dollar américain", symbol: "$" },
  { code: "GBP", label: "Livre sterling", symbol: "£" },
  { code: "CHF", label: "Franc suisse", symbol: "CHF" },
  { code: "CAD", label: "Dollar canadien", symbol: "$" },
  { code: "MAD", label: "Dirham marocain", symbol: "DH" },
  { code: "XOF", label: "Franc CFA (XOF)", symbol: "CFA" },
  { code: "DZD", label: "Dinar algérien", symbol: "DA" },
  { code: "TND", label: "Dinar tunisien", symbol: "DT" },
];
