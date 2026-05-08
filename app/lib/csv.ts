import Papa from "papaparse";

export const PRODUCT_COLUMNS = [
  "Product Name*",
  "Description",
  "Category",
  "SKU",
  "Sale Price*",
  "Cost Price*",
  "Stock Quantity*",
  "Unit*",
  "Status*",
] as const;

export const CUSTOMER_COLUMNS = [
  "Full Name*",
  "Email*",
  "Phone*",
  "Country",
  "City",
  "Street Address",
  "Account Status*",
] as const;

export const ORDER_COLUMNS = [
  "Customer ID*",
  "Date*",
  "Total Amount*",
  "Status*",
  "Payment Status*",
  "Payment Method*",
  "Shipping Address*",
] as const;

export type CsvModule = "products" | "customers" | "orders";

export const TEMPLATE_COLUMNS: Record<CsvModule, readonly string[]> = {
  products: PRODUCT_COLUMNS,
  customers: CUSTOMER_COLUMNS,
  orders: ORDER_COLUMNS,
};

export function generateCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: readonly string[]
): string {
  return Papa.unparse({ fields: columns as string[], data: rows.map((r) => columns.map((c) => r[c] ?? "")) });
}

export function generateTemplateCsv(module: CsvModule): string {
  const columns = TEMPLATE_COLUMNS[module];
  return Papa.unparse({ fields: columns as string[], data: [] });
}

export function parseCsv(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data.filter((r) => Object.values(r).some((v) => v != null && String(v).trim() !== ""));
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export function getCellTrimmed(row: Record<string, string>, key: string): string {
  const value = row[key];
  if (value == null) return "";
  return String(value).trim();
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}
