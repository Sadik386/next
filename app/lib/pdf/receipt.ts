import jsPDF from "jspdf"
import { ReceiptData } from "./types"

type RGB = [number, number, number]

const PAGE_WIDTH = 80
const MARGIN = 5
const ITEM_WIDTH = 40
const QTY_X = 51
const AMOUNT_X = PAGE_WIDTH - MARGIN
const INK: RGB = [15, 23, 42]
const TEXT: RGB = [30, 41, 59]
const MUTED: RGB = [100, 116, 139]
const BORDER: RGB = [203, 213, 225]
const SOFT: RGB = [248, 250, 252]
const WHITE: RGB = [255, 255, 255]

export async function generateReceiptPDF(data: ReceiptData): Promise<Blob> {
  const pageHeight = estimateReceiptHeight(data)
  const doc = new jsPDF({
    format: [PAGE_WIDTH, pageHeight],
    orientation: "portrait",
    unit: "mm",
  })

  let y = 8

  doc.setFillColor(...WHITE)
  doc.rect(0, 0, PAGE_WIDTH, pageHeight, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  const businessName = safe(data.business.name, "")
  if (businessName) {
    doc.text(fitTextLines(doc, businessName, PAGE_WIDTH - MARGIN * 2, 2), PAGE_WIDTH / 2, y, {
      align: "center",
    })
    y += 8
  }

  if (data.business.address) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.8)
    doc.setTextColor(...MUTED)
    const addressLines = fitTextLines(doc, data.business.address, PAGE_WIDTH - MARGIN * 2, 2)
    doc.text(addressLines, PAGE_WIDTH / 2, y, { align: "center", maxWidth: PAGE_WIDTH - MARGIN * 2 })
    y += addressLines.length * 3.2 + 1
  }

  const contactLine = compact([data.business.phone, data.business.email]).join(" | ")
  if (contactLine) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.8)
    doc.setTextColor(...MUTED)
    const contactLines = fitTextLines(doc, contactLine, PAGE_WIDTH - MARGIN * 2, 2)
    doc.text(contactLines, PAGE_WIDTH / 2, y, { align: "center", maxWidth: PAGE_WIDTH - MARGIN * 2 })
    y += contactLines.length * 3.2 + 1
  }

  divider(doc, y)
  y += 5

  drawInfoRow(doc, "Receipt", data.receiptId, y)
  y += 4
  drawInfoRow(doc, "Date", data.date, y)
  y += 4
  if (data.customer) {
    drawInfoRow(doc, "Customer", data.customer.name, y)
    y += 4
  }

  y += 2
  divider(doc, y)
  y += 5

  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.7)
  doc.setTextColor(...MUTED)
  doc.text("ITEM", MARGIN, y)
  doc.text("QTY", QTY_X, y, { align: "center" })
  doc.text("AMOUNT", AMOUNT_X, y, { align: "right" })
  y += 3.4
  divider(doc, y)
  y += 3.4

  data.items.forEach((item) => {
    y = drawItem(doc, data, item, y)
  })

  y += 1
  divider(doc, y)
  y += 5

  drawMoneyRow(doc, "Subtotal", money(data.currencySymbol, data.subtotal), y)
  y += 4.4

  if (Number(data.discount ?? 0) > 0) {
    drawMoneyRow(doc, "Discount", `-${money(data.currencySymbol, data.discount ?? 0)}`, y)
    y += 4.4
  }

  if (Number(data.tax ?? 0) > 0) {
    drawMoneyRow(doc, "Tax", money(data.currencySymbol, data.tax ?? 0), y)
    y += 4.4
  }

  doc.setFillColor(...SOFT)
  doc.setDrawColor(...BORDER)
  doc.roundedRect(MARGIN, y, PAGE_WIDTH - MARGIN * 2, 10, 1.5, 1.5, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.8)
  doc.setTextColor(...INK)
  doc.text("TOTAL", MARGIN + 3, y + 6.4)
  doc.text(money(data.currencySymbol, data.total), PAGE_WIDTH - MARGIN - 3, y + 6.4, { align: "right" })
  y += 14

  drawInfoRow(doc, "Payment", paymentLabel(data), y)
  y += 4

  if (data.paidAmount !== undefined) {
    drawInfoRow(doc, "Paid", money(data.currencySymbol, data.paidAmount), y)
    y += 4
  }

  if (Number(data.balanceDue ?? 0) > 0) {
    drawInfoRow(doc, "Due", money(data.currencySymbol, data.balanceDue), y)
    y += 4
  }

  if (Number(data.change ?? 0) > 0) {
    drawInfoRow(doc, "Change", money(data.currencySymbol, data.change), y)
    y += 4
  }

  y += 3
  divider(doc, y)
  y += 6

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  doc.text("Thank you", PAGE_WIDTH / 2, y, { align: "center" })
  y += 6

  if (data.business.invoiceFooter) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.8)
    doc.setTextColor(...MUTED)
    const footerLines = fitTextLines(doc, data.business.invoiceFooter, PAGE_WIDTH - MARGIN * 2, 4)
    doc.text(footerLines, PAGE_WIDTH / 2, y, { align: "center", maxWidth: PAGE_WIDTH - MARGIN * 2 })
  }

  return doc.output("blob")
}

function drawItem(doc: jsPDF, data: ReceiptData, item: ReceiptData["items"][number], y: number) {
  const nameLines = fitTextLines(doc, safe(item.name, "Item"), ITEM_WIDTH, 4)
  const metaLines = itemMeta(item) ? fitTextLines(doc, itemMeta(item), ITEM_WIDTH, 3) : []
  const startY = y

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.2)
  doc.setTextColor(...TEXT)
  doc.text(nameLines, MARGIN, y, { maxWidth: ITEM_WIDTH })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...TEXT)
  doc.text(String(item.quantity), QTY_X, startY, { align: "center" })
  doc.text(money(data.currencySymbol, item.total), AMOUNT_X, startY, { align: "right" })

  y += nameLines.length * 3.4

  if (metaLines.length) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.2)
    doc.setTextColor(...MUTED)
    doc.text(metaLines, MARGIN, y, { maxWidth: ITEM_WIDTH })
    y += metaLines.length * 3
  }

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.2)
  doc.setTextColor(...MUTED)
  doc.text(`x ${money(data.currencySymbol, item.unitPrice)}`, QTY_X, startY + 3.3, { align: "center" })

  return Math.max(y + 2.4, startY + 7.2)
}

function drawInfoRow(doc: jsPDF, label: string, value: string, y: number) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(...MUTED)
  doc.text(`${label}:`, MARGIN, y)

  doc.setFont("helvetica", "bold")
  doc.setTextColor(...TEXT)
  doc.text(trimForWidth(doc, safe(value, "N/A"), PAGE_WIDTH - 27), AMOUNT_X, y, { align: "right" })
}

function drawMoneyRow(doc: jsPDF, label: string, value: string, y: number) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.4)
  doc.setTextColor(...TEXT)
  doc.text(label, MARGIN, y)

  doc.setFont("helvetica", "bold")
  doc.text(value, AMOUNT_X, y, { align: "right" })
}

function divider(doc: jsPDF, y: number) {
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.12)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
}

function estimateReceiptHeight(data: ReceiptData) {
  const contactLine = compact([data.business.phone, data.business.email]).join(" | ")
  const businessHeaderHeight =
    (data.business.address ? roughLines(data.business.address, 38) * 3.2 + 1 : 0) +
    (contactLine ? roughLines(contactLine, 40) * 3.2 + 1 : 0)
  const itemHeight = data.items.reduce((total, item) => {
    const nameLines = roughLines(safe(item.name, "Item"), 26)
    const meta = itemMeta(item)
    const metaLines = meta ? roughLines(meta, 30) : 0
    return total + 8 + nameLines * 3.4 + metaLines * 3
  }, 0)

  const footerHeight = data.business.invoiceFooter ? roughLines(data.business.invoiceFooter, 38) * 3.2 + 8 : 0
  const paymentRows = 12 + (Number(data.balanceDue ?? 0) > 0 ? 4 : 0) + (Number(data.change ?? 0) > 0 ? 4 : 0)
  const estimated = 78 + businessHeaderHeight + itemHeight + paymentRows + footerHeight
  return Math.min(1000, Math.max(150, estimated))
}

function itemMeta(item: ReceiptData["items"][number]) {
  return compact([
    item.variantLabel ? `Variant: ${item.variantLabel}` : undefined,
    item.sku ? `SKU: ${item.sku}` : undefined,
  ]).join("\n")
}

function paymentLabel(data: ReceiptData) {
  const method = safe(data.paymentMethod, "Cash")
  return data.paymentStatus ? `${method} / ${titleCase(data.paymentStatus)}` : method
}

function money(prefix: string, value: number | undefined) {
  return `${prefix}${Number(value ?? 0).toFixed(2)}`
}

function safe(value: string | undefined | null, fallback: string) {
  const text = String(value ?? "").trim()
  return text.length > 0 ? text : fallback
}

function compact(values: Array<string | undefined | null>) {
  return values.map((value) => String(value ?? "").trim()).filter(Boolean)
}

function roughLines(value: string, charsPerLine: number) {
  return String(value)
    .split(/\r?\n/)
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / charsPerLine)), 0)
}

function titleCase(value: string) {
  const clean = String(value || "").replace(/[_-]+/g, " ").trim()
  if (!clean) return "N/A"
  return clean.replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
}

function trimForWidth(doc: jsPDF, value: string, maxWidth: number) {
  let text = value.trim()
  if (doc.getTextWidth(text) <= maxWidth) return text
  while (text.length > 3 && doc.getTextWidth(`${text}...`) > maxWidth) {
    text = text.slice(0, -1)
  }
  return `${text.trim()}...`
}

function fitTextLines(doc: jsPDF, value: string, maxWidth: number, maxLines: number) {
  const text = value.trim()
  if (!text) return []

  const raw = (doc.splitTextToSize(text, maxWidth) as string[]).filter(Boolean)
  if (raw.length <= maxLines) return raw

  const lines = raw.slice(0, maxLines)
  let last = lines[maxLines - 1]
  while (last.length > 3 && doc.getTextWidth(`${last}...`) > maxWidth) {
    last = last.slice(0, -1)
  }
  lines[maxLines - 1] = `${last.trim()}...`
  return lines
}
