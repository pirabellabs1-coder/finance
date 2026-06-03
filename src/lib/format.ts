import type { CurrencyCode } from "./types";

const LOCALE = "fr-FR";

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "EUR",
): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Like formatCurrency but always shows an explicit + / − sign. */
export function formatSigned(
  amount: number,
  currency: CurrencyCode = "EUR",
): string {
  const abs = formatCurrency(Math.abs(amount), currency);
  return `${amount < 0 ? "−" : "+"}${abs}`;
}

/** Compact form for axes / tight spaces, e.g. 12,3 k€. */
export function formatCompact(
  amount: number,
  currency: CurrencyCode = "EUR",
): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(
  iso: string,
  style: "short" | "medium" | "long" = "medium",
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const options: Intl.DateTimeFormatOptions =
    style === "short"
      ? { day: "2-digit", month: "2-digit", year: "2-digit" }
      : style === "long"
        ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
        : { day: "numeric", month: "short", year: "numeric" };
  return new Intl.DateTimeFormat(LOCALE, options).format(date);
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Build a readable "Prénom Nom" with sensible fallbacks. */
export function fullName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export function initials(firstName: string, lastName: string): string {
  return (
    (firstName?.[0] ?? "") + (lastName?.[0] ?? "")
  ).toUpperCase() || "?";
}
