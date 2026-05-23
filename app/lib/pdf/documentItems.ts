import type { DeliverySlipData, InvoiceData, ReceiptData } from "./types"
import { optionalText, safeText } from "./formatters"

type DecimalLike = number | string | { toString(): string }

export type OrderDocumentItemSource = {
  productName: string
  variantLabel?: string | null
  skuSnapshot?: string | null
  quantity: number
  unitPrice: DecimalLike
  totalPrice: DecimalLike
  product?: {
    sku?: string | null
    unit?: string | null
  } | null
}

export type SaleDocumentItemSource = {
  productName?: string | null
  variantLabel?: string | null
  skuSnapshot?: string | null
  quantity: number
  unitPrice: DecimalLike
  totalAmount: DecimalLike
}

export type ReceiptSourceWithOrderItems = SaleDocumentItemSource & {
  order?: {
    items?: OrderDocumentItemSource[] | null
  } | null
}

function toNumber(value: DecimalLike | null | undefined) {
  return Number(value ?? 0)
}

function variantLabel(value: string | null | undefined) {
  return optionalText(value)
}

function skuSnapshot(snapshot: string | null | undefined, currentSku?: string | null) {
  return optionalText(snapshot) ?? optionalText(currentSku)
}

export function mapOrderInvoiceItems(items: OrderDocumentItemSource[]): InvoiceData["items"] {
  return items.map((item) => ({
    name: safeText(item.productName, "Item"),
    variantLabel: variantLabel(item.variantLabel),
    sku: skuSnapshot(item.skuSnapshot, item.product?.sku),
    quantity: item.quantity,
    unitPrice: toNumber(item.unitPrice),
    totalPrice: toNumber(item.totalPrice),
  }))
}

export function mapOrderDeliveryItems(items: OrderDocumentItemSource[]): DeliverySlipData["items"] {
  return items.map((item) => ({
    name: safeText(item.productName, "Item"),
    variantLabel: variantLabel(item.variantLabel),
    sku: skuSnapshot(item.skuSnapshot, item.product?.sku),
    quantity: item.quantity,
    unit: safeText(item.product?.unit, "pcs"),
  }))
}

export function mapOrderReceiptItems(items: OrderDocumentItemSource[]): ReceiptData["items"] {
  return items.map((item) => ({
    name: safeText(item.productName, "Item"),
    variantLabel: variantLabel(item.variantLabel),
    sku: skuSnapshot(item.skuSnapshot, item.product?.sku),
    quantity: item.quantity,
    unitPrice: toNumber(item.unitPrice),
    total: toNumber(item.totalPrice),
  }))
}

export function mapSaleReceiptItem(sale: SaleDocumentItemSource): ReceiptData["items"][number] {
  return {
    name: safeText(sale.productName, "Product"),
    variantLabel: variantLabel(sale.variantLabel),
    sku: skuSnapshot(sale.skuSnapshot),
    quantity: sale.quantity,
    unitPrice: toNumber(sale.unitPrice),
    total: toNumber(sale.totalAmount),
  }
}

export function mapReceiptItems(source: ReceiptSourceWithOrderItems): ReceiptData["items"] {
  const orderItems = source.order?.items
  return orderItems && orderItems.length > 0
    ? mapOrderReceiptItems(orderItems)
    : [mapSaleReceiptItem(source)]
}
