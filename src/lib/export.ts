import { getCategory, paymentLabel } from "./constants";
import { formatCurrency, formatDate } from "./format";
import type { CurrencyCode, Transaction } from "./types";

function escapeCSV(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds a `;`-separated, BOM-prefixed CSV that opens cleanly in Excel. */
export function transactionsToCSV(
  txs: Transaction[],
  currency: CurrencyCode = "EUR",
): string {
  void currency;
  const headers = [
    "Date",
    "Type",
    "Catégorie",
    "Description",
    "Moyen de paiement",
    "Référence",
    "Montant",
  ];
  const rows = txs.map((t) => [
    t.date,
    t.type === "income" ? "Revenu" : "Dépense",
    getCategory(t.categoryId)?.label ?? t.categoryId,
    t.description,
    paymentLabel(t.paymentMethod),
    t.reference ?? "",
    (t.type === "income" ? t.amount : -t.amount).toFixed(2).replace(".", ","),
  ]);
  const lines = [headers, ...rows].map((cols) =>
    cols.map((c) => escapeCSV(String(c))).join(";"),
  );
  return "﻿" + lines.join("\r\n");
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadTransactionsCSV(
  txs: Transaction[],
  currency: CurrencyCode = "EUR",
  filename = "transactions.csv",
): void {
  downloadFile(
    filename,
    transactionsToCSV(txs, currency),
    "text/csv;charset=utf-8;",
  );
}

/** Opens a clean print view; the user can "Enregistrer en PDF" from the dialog. */
export function printTransactions(
  txs: Transaction[],
  currency: CurrencyCode = "EUR",
  title = "Mes transactions",
): void {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;

  const income = txs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const rowsHtml = txs
    .map(
      (t) => `<tr>
        <td>${formatDate(t.date, "short")}</td>
        <td>${t.type === "income" ? "Revenu" : "Dépense"}</td>
        <td>${escapeHtml(getCategory(t.categoryId)?.label ?? t.categoryId)}</td>
        <td>${escapeHtml(t.description)}</td>
        <td>${escapeHtml(paymentLabel(t.paymentMethod))}</td>
        <td class="amount ${t.type}">${t.type === "income" ? "+" : "−"}${escapeHtml(
          formatCurrency(t.amount, currency),
        )}</td>
      </tr>`,
    )
    .join("");

  win.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  * { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
  body { margin: 32px; color: #0f172a; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
  .summary { display: flex; gap: 24px; margin-bottom: 20px; font-size: 13px; }
  .summary b { display: block; font-size: 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  th { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px; }
  .amount { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .income { color: #059669; }
  .expense { color: #e11d48; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">${txs.length} transaction(s) · exporté le ${formatDate(
    new Date().toISOString(),
    "long",
  )}</div>
  <div class="summary">
    <div>Revenus <b class="income">${escapeHtml(formatCurrency(income, currency))}</b></div>
    <div>Dépenses <b class="expense">${escapeHtml(formatCurrency(expense, currency))}</b></div>
    <div>Solde <b>${escapeHtml(formatCurrency(income - expense, currency))}</b></div>
  </div>
  <table>
    <thead>
      <tr><th>Date</th><th>Type</th><th>Catégorie</th><th>Description</th><th>Paiement</th><th class="amount">Montant</th></tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`);
  win.document.close();
}
