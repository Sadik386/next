export type AddressSource = {
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
}

export function safeText(value: string | number | null | undefined, fallback = "") {
  const text = String(value ?? "").trim()
  return text.length > 0 ? text : fallback
}

export function optionalText(value: string | number | null | undefined) {
  const text = safeText(value)
  return text.length > 0 ? text : undefined
}

export function compact(values: Array<string | number | null | undefined>) {
  return values.map((value) => safeText(value)).filter(Boolean)
}

export function compactAddress(source: AddressSource | null | undefined) {
  const parts = compact([
    source?.address,
    source?.city,
    source?.state,
    source?.zipCode,
    source?.country,
  ])
  return parts.length ? parts.join(", ") : undefined
}

export function currencyPrefix(currency: string | null | undefined) {
  if (currency === "USD") return "$"
  if (currency === "EUR") return "EUR "
  if (currency === "BDT" || !currency) return "Tk "
  return `${currency} `
}

export function money(prefix: string, value: number | string | null | undefined) {
  return `${prefix}${Number(value ?? 0).toFixed(2)}`
}

export function formatDocumentDate(date: Date | string | number | null | undefined) {
  const parsed = date instanceof Date ? date : new Date(date ?? "")
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function titleCase(value: string | null | undefined) {
  const clean = String(value || "").replace(/[_-]+/g, " ").trim()
  if (!clean) return "N/A"
  return clean.replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
}
