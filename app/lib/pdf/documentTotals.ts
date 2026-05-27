import type { InvoiceData, ReceiptData } from "./types"

type DecimalLike = number | string | { toString(): string }

type OrderTotalsSource = {
  subtotal: DecimalLike
  taxAmount: DecimalLike
  discountAmount: DecimalLike
  totalAmount: DecimalLike
  paidAmount: DecimalLike
  paymentMethod?: string | null
  paymentStatus?: string | null
}

type ReceiptTotalsSource = {
  totalAmount: DecimalLike
  taxAmount: DecimalLike
  discountAmount: DecimalLike
  paymentMethod?: string | null
  paymentStatus?: string | null
  order?: {
    subtotal: DecimalLike
    taxAmount: DecimalLike
    discountAmount: DecimalLike
    totalAmount: DecimalLike
    paidAmount: DecimalLike
    paymentStatus?: string | null
  } | null
}

function toNumber(value: DecimalLike | null | undefined) {
  return Number(value ?? 0)
}

function positiveOrUndefined(value: number) {
  return value > 0 ? value : undefined
}

export function paidBalanceDue(totalAmount: DecimalLike, paidAmount: DecimalLike) {
  const paid = toNumber(paidAmount)
  const balanceDue = Math.max(0, toNumber(totalAmount) - paid)
  return { paidAmount: paid, balanceDue }
}

export function invoiceTotals(order: OrderTotalsSource): Pick<
  InvoiceData,
  "subtotal" | "tax" | "discount" | "total" | "paymentMethod" | "paymentStatus" | "paidAmount" | "balanceDue"
> {
  const total = toNumber(order.totalAmount)
  const paid = toNumber(order.paidAmount)
  const balanceDue = total - paid

  return {
    subtotal: toNumber(order.subtotal),
    tax: positiveOrUndefined(toNumber(order.taxAmount)),
    discount: positiveOrUndefined(toNumber(order.discountAmount)),
    total,
    paymentMethod: order.paymentMethod || undefined,
    paymentStatus: order.paymentStatus || undefined,
    paidAmount: positiveOrUndefined(paid),
    balanceDue: positiveOrUndefined(balanceDue),
  }
}

export function deliveryTotals(order: OrderTotalsSource) {
  const balanceDue = toNumber(order.totalAmount) - toNumber(order.paidAmount)
  return {
    balanceDue,
    codAmount: positiveOrUndefined(balanceDue),
  }
}

export function receiptTotals(sale: ReceiptTotalsSource): Pick<
  ReceiptData,
  "subtotal" | "discount" | "tax" | "total" | "paymentMethod" | "paymentStatus" | "paidAmount" | "balanceDue" | "change"
> {
  if (sale.order) {
    const total = toNumber(sale.order.totalAmount ?? sale.totalAmount)
    const paidAmount = toNumber(sale.order.paidAmount)
    const balanceDue = Math.max(0, total - paidAmount)
    return {
      subtotal: toNumber(sale.order.subtotal),
      discount: positiveOrUndefined(toNumber(sale.order.discountAmount)),
      tax: positiveOrUndefined(toNumber(sale.order.taxAmount)),
      total,
      paymentMethod: sale.paymentMethod || "Cash",
      paymentStatus: sale.order.paymentStatus ?? sale.paymentStatus ?? undefined,
      paidAmount,
      balanceDue: positiveOrUndefined(balanceDue),
      change: 0,
    }
  }

  const total = toNumber(sale.totalAmount)
  const paidAmount = total
  const balanceDue = Math.max(0, total - paidAmount)

  return {
    subtotal: total - toNumber(sale.taxAmount) + toNumber(sale.discountAmount),
    discount: positiveOrUndefined(toNumber(sale.discountAmount)),
    tax: positiveOrUndefined(toNumber(sale.taxAmount)),
    total,
    paymentMethod: sale.paymentMethod || "Cash",
    paymentStatus: sale.paymentStatus ?? undefined,
    paidAmount,
    balanceDue: positiveOrUndefined(balanceDue),
    change: 0,
  }
}
