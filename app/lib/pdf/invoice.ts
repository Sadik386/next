import jsPDF from "jspdf"
import { autoTable } from "jspdf-autotable"
import { InvoiceData } from "./types"

type RGB = [number, number, number]
type TotalsRow = { label: string; value: string }
type InfoCard = { label: string; value: string; helper: string; accent?: boolean }
type LogoAsset = { dataUrl: string; format: "PNG" | "JPEG" }

const DEFAULT_BRAND: RGB = [255, 104, 84]
const TEXT: RGB = [17, 24, 39]
const MUTED: RGB = [102, 112, 133]
const BORDER: RGB = [231, 235, 240]
const WHITE: RGB = [255, 255, 255]

const PAGE_MARGIN = 12
const TOP_BAR_HEIGHT = 2.2
const HEADER_Y = 10
const META_Y = 28
const PARTY_Y = 42
const TABLE_Y = 67
const BOTTOM_BAR_HEIGHT = 1.8

export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  const doc = new jsPDF({ format: "a5", orientation: "portrait", unit: "mm" })
  const pageHeight = doc.internal.pageSize.getHeight()
  const brand = hexToRgb(data.business.brandColor) ?? DEFAULT_BRAND
  const logo = await loadLogo(data.business.logoUrl)
  const hasItemDiscount = data.items.some((item) => itemDiscount(item) > 0)

  autoTable(doc, {
    startY: TABLE_Y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: TABLE_Y, bottom: 18 },
    pageBreak: "auto",
    rowPageBreak: "avoid",
    showHead: "everyPage",
    head: [["Description", "Qty", "Unit", hasItemDiscount ? "Discount" : "", "Amount"]],
    body: (data.items.length ? data.items : [{ name: "No items available", quantity: 0, unitPrice: 0, totalPrice: 0 }]).map((item) => [
      safe(item.name, "Item"),
      item.quantity > 0 ? String(item.quantity) : "",
      item.quantity > 0 ? money(data.currencySymbol, item.unitPrice) : "",
      hasItemDiscount && itemDiscount(item) > 0 ? money(data.currencySymbol, itemDiscount(item)) : "",
      item.quantity > 0 ? money(data.currencySymbol, item.totalPrice) : "",
    ]),
    willDrawPage: () => drawPageHeader(doc, data, logo, brand),
    headStyles: {
      fillColor: mixRgb(brand, WHITE, 0.96),
      textColor: MUTED,
      font: "helvetica",
      fontStyle: "bold",
      fontSize: 6.3,
      cellPadding: { top: 1.4, right: 1.6, bottom: 1.7, left: 1.6 },
      lineColor: mixRgb(brand, WHITE, 0.8),
      lineWidth: { bottom: 0.25 },
    },
    bodyStyles: {
      font: "helvetica",
      fontSize: 7.5,
      fontStyle: "normal",
      textColor: TEXT,
      cellPadding: { top: 1.6, right: 1.6, bottom: 1.6, left: 1.6 },
      fillColor: WHITE,
      lineColor: BORDER,
      lineWidth: { bottom: 0.08 },
    },
    styles: { overflow: "linebreak", minCellHeight: 5.2, valign: "middle" },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 12 },
      2: { halign: "right", cellWidth: 19 },
      3: { halign: "right", cellWidth: hasItemDiscount ? 16 : 1 },
      4: { halign: "right", cellWidth: 24 },
    },
    didParseCell: (hook) => {
      if (hook.section === "body" && hook.column.index === 0) {
        hook.cell.styles.fontStyle = "bold"
      }
      if (hook.section === "body" && hook.column.index === 4) {
        hook.cell.styles.fontStyle = "bold"
        hook.cell.styles.textColor = brand
      }
      if (hook.section === "body" && !data.items.length) {
        hook.cell.styles.textColor = MUTED
        if (hook.column.index === 0) hook.cell.styles.halign = "center"
      }
    },
  })

  let y = ((doc as any).lastAutoTable?.finalY ?? TABLE_Y) + 6
  const summaryHeight = estimateSummaryHeight(doc, data)
  if (y + summaryHeight > pageHeight - 18) {
    doc.addPage()
    drawPageHeader(doc, data, logo, brand)
    y = TABLE_Y + 2
  } else {
    y = Math.max(y, TABLE_Y + 2)
  }

  drawSummarySection(doc, data, y, brand)
  drawFooterOnAllPages(doc, data, brand)

  return doc.output("blob")
}

function drawPageHeader(doc: jsPDF, data: InvoiceData, logo: LogoAsset | null, brand: RGB) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const businessName = safe(data.business.name, "My Business")
  const businessLines = compact([
    data.business.address,
    compact([data.business.phone, data.business.email]).join(" | "),
    data.business.taxId ? `Tax ID: ${data.business.taxId}` : undefined,
  ])
  const paymentStatus = titleCase(data.paymentStatus ?? (balanceDue(data) > 0 ? "partial" : "paid"))

  doc.setFillColor(...WHITE)
  doc.rect(0, 0, pageWidth, pageHeight, "F")
  doc.setFillColor(...brand)
  doc.rect(0, 0, pageWidth, TOP_BAR_HEIGHT, "F")

  drawLogo(doc, logo, brand, PAGE_MARGIN, HEADER_Y, businessName)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...TEXT)
  doc.text(trimForWidth(doc, businessName, 48), PAGE_MARGIN + 30, HEADER_Y + 5.8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.1)
  doc.setTextColor(...MUTED)
  businessLines.slice(0, 3).forEach((line, index) => {
    doc.text(trimForWidth(doc, line, 48), PAGE_MARGIN + 30, HEADER_Y + 9.6 + index * 3.2)
  })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.2)
  doc.setTextColor(...brand)
  doc.text("SALES INVOICE", pageWidth - PAGE_MARGIN, HEADER_Y + 1.7, { align: "right" })

  doc.setFontSize(18)
  doc.setTextColor(...TEXT)
  doc.text("INVOICE", pageWidth - PAGE_MARGIN, HEADER_Y + 8.5, { align: "right" })

  drawStatusPill(doc, pageWidth - PAGE_MARGIN - 31, HEADER_Y + 10.5, 31, paymentStatus, brand)
  drawMetaCards(doc, data, brand)
  drawPartyCards(doc, data, brand)
}

function drawMetaCards(doc: jsPDF, data: InvoiceData, brand: RGB) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  const gap = 2.5
  const width = (contentWidth - gap * 3) / 4
  const cards: InfoCard[] = [
    { label: "Invoice No", value: safe(data.invoiceNumber, "N/A"), helper: "Reference" },
    { label: "Order ID", value: safe(data.orderId ?? data.invoiceNumber, "N/A"), helper: "Order reference" },
    { label: "Date", value: safe(data.date, "N/A"), helper: "Issue date" },
    {
      label: "Payment",
      value: paymentLabel(data.paymentMethod),
      helper: titleCase(data.paymentStatus ?? (balanceDue(data) > 0 ? "partial" : "paid")),
      accent: true,
    },
  ]

  cards.forEach((card, index) => {
    drawMetaCard(doc, PAGE_MARGIN + index * (width + gap), META_Y, width, 13.2, card, brand)
  })
}

function drawMetaCard(doc: jsPDF, x: number, y: number, width: number, height: number, card: InfoCard, brand: RGB) {
  const fill = card.accent ? mixRgb(brand, WHITE, 0.96) : WHITE
  const stroke = card.accent ? mixRgb(brand, WHITE, 0.72) : BORDER

  doc.setFillColor(...fill)
  doc.setDrawColor(...stroke)
  doc.roundedRect(x, y, width, height, 2.8, 2.8, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(5.8)
  doc.setTextColor(...(card.accent ? brand : MUTED))
  doc.text(card.label.toUpperCase(), x + 2.6, y + 3.8)

  doc.setFontSize(8.2)
  doc.setTextColor(...TEXT)
  doc.text(trimForWidth(doc, card.value, width - 5.2), x + 2.6, y + 8.1, { maxWidth: width - 5.2 })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(5.6)
  doc.setTextColor(...MUTED)
  doc.text(trimForWidth(doc, card.helper, width - 5.2), x + 2.6, y + 11.4, { maxWidth: width - 5.2 })
}

function drawPartyCards(doc: jsPDF, data: InvoiceData, brand: RGB) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  const gap = 3
  const width = (contentWidth - gap) / 2
  const customerLines = compact([
    data.customer.phone,
    data.customer.email,
    data.customer.billingAddress ?? data.customer.shippingAddress,
  ])
  const businessLines = compact([
    data.business.address,
    compact([data.business.phone, data.business.email]).join(" | "),
    data.business.taxId ? `Tax ID: ${data.business.taxId}` : undefined,
  ])

  drawPartyCard(
    doc,
    PAGE_MARGIN,
    PARTY_Y,
    width,
    20.5,
    "Bill To",
    safe(data.customer.name, "Walk-in Customer"),
    customerLines.length ? customerLines : ["Customer details not available"],
    brand,
  )

  drawPartyCard(
    doc,
    PAGE_MARGIN + width + gap,
    PARTY_Y,
    width,
    20.5,
    "From",
    safe(data.business.name, "My Business"),
    businessLines.length ? businessLines : ["Business details not available"],
    brand,
  )
}

function drawPartyCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  title: string,
  lines: string[],
  brand: RGB,
) {
  doc.setFillColor(...WHITE)
  doc.setDrawColor(...BORDER)
  doc.roundedRect(x, y, width, height, 3, 3, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(5.8)
  doc.setTextColor(...brand)
  doc.text(label.toUpperCase(), x + 3, y + 4)

  doc.setFontSize(8.4)
  doc.setTextColor(...TEXT)
  doc.text(trimForWidth(doc, title, width - 6), x + 3, y + 8.4)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6)
  doc.setTextColor(...MUTED)

  const detailLines = lines.flatMap((line) => fitTextLines(doc, line, width - 6, 2)).slice(0, 3)
  detailLines.forEach((line, index) => {
    doc.text(line, x + 3, y + 12.2 + index * 3)
  })
}

function drawLogo(doc: jsPDF, logo: LogoAsset | null, brand: RGB, x: number, y: number, name: string) {
  const boxWidth = 26
  const boxHeight = 14

  doc.setFillColor(...mixRgb(brand, WHITE, 0.96))
  doc.setDrawColor(...mixRgb(brand, WHITE, 0.78))
  doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, "FD")

  if (logo) {
    try {
      const size = imageFit(doc, logo.dataUrl, 20, 9)
      doc.addImage(logo.dataUrl, logo.format, x + (boxWidth - size.width) / 2, y + (boxHeight - size.height) / 2, size.width, size.height)
      return
    } catch {
      // Fallback to the brand mark below when the uploaded logo cannot be embedded.
    }
  }

  doc.setDrawColor(...brand)
  doc.setLineWidth(1.5)
  doc.line(x + 3.2, y + 8.5, x + 9, y + 5.2)
  doc.line(x + 6.8, y + 10.2, x + 12.6, y + 6.9)
  doc.line(x + 10.4, y + 11.9, x + 16.2, y + 8.6)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(5.6)
  doc.setTextColor(...brand)
  doc.text(initials(name), x + 18.2, y + 9.2)
}

function imageFit(doc: jsPDF, src: string, maxWidth: number, maxHeight: number) {
  const props = (doc as any).getImageProperties?.(src)
  const ratio = props?.width && props?.height ? props.width / props.height : maxWidth / maxHeight
  let width = maxWidth
  let height = width / ratio
  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }
  return { width, height }
}

function drawStatusPill(doc: jsPDF, x: number, y: number, width: number, text: string, brand: RGB) {
  doc.setFillColor(...mixRgb(brand, WHITE, 0.94))
  doc.setDrawColor(...mixRgb(brand, WHITE, 0.74))
  doc.roundedRect(x, y, width, 5.8, 2.9, 2.9, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(5.8)
  doc.setTextColor(...brand)
  doc.text(trimForWidth(doc, text.toUpperCase(), width - 4), x + width / 2, y + 3.8, { align: "center" })
}

function drawSummarySection(doc: jsPDF, data: InvoiceData, y: number, brand: RGB) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  const gap = 4
  const totalsWidth = 48
  const noteWidth = contentWidth - totalsWidth - gap
  const height = Math.max(36, estimateSummaryHeight(doc, data) - 1.5)

  drawNoteCard(doc, PAGE_MARGIN, y, noteWidth, height, data, brand)
  drawTotalsCard(doc, PAGE_MARGIN + noteWidth + gap, y, totalsWidth, height, data, brand)
}

function drawNoteCard(doc: jsPDF, x: number, y: number, width: number, height: number, data: InvoiceData, brand: RGB) {
  const status = titleCase(data.paymentStatus ?? (balanceDue(data) > 0 ? "partial" : "paid"))
  const note = safe(data.business.invoiceFooter, "Thank you for your business.")
  const noteLines = fitTextLines(doc, note, width - 8, data.notes ? 4 : 6)
  const orderNoteLines = data.notes ? fitTextLines(doc, `Order note: ${data.notes}`, width - 8, 3) : []

  doc.setFillColor(...WHITE)
  doc.setDrawColor(...BORDER)
  doc.roundedRect(x, y, width, height, 3.2, 3.2, "FD")

  drawStatusPill(doc, x + 4, y + 4, 24, status, brand)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...TEXT)
  doc.text("Thank you for your order.", x + 4, y + 13.5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.3)
  doc.setTextColor(...MUTED)
  doc.text(noteLines, x + 4, y + 18.5, { maxWidth: width - 8 })

  if (orderNoteLines.length) {
    const noteOffset = y + 18.5 + noteLines.length * 3.1 + 2.2
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6.1)
    doc.setTextColor(...TEXT)
    doc.text("Order note", x + 4, noteOffset)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.1)
    doc.setTextColor(...MUTED)
    doc.text(orderNoteLines, x + 4, noteOffset + 3.2, { maxWidth: width - 8 })
  }
}

function drawTotalsCard(doc: jsPDF, x: number, y: number, width: number, height: number, data: InvoiceData, brand: RGB) {
  const due = balanceDue(data)
  const rows = buildSummaryRows(data, due)
  const highlightLabel = due > 0 ? "Total Due" : "Grand Total"
  const highlightValue = money(data.currencySymbol, due > 0 ? due : data.total)

  doc.setFillColor(...mixRgb(brand, WHITE, 0.96))
  doc.setDrawColor(...mixRgb(brand, WHITE, 0.72))
  doc.roundedRect(x, y, width, height, 3.2, 3.2, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(5.8)
  doc.setTextColor(...brand)
  doc.text("SUMMARY", x + 4, y + 5)

  let rowY = y + 10
  rows.forEach((row) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.5)
    doc.setTextColor(...MUTED)
    doc.text(row.label, x + 4, rowY)

    doc.setFont("helvetica", "bold")
    doc.setTextColor(...TEXT)
    doc.text(row.value, x + width - 4, rowY, { align: "right" })

    doc.setDrawColor(...mixRgb(brand, WHITE, 0.84))
    doc.setLineWidth(0.12)
    doc.line(x + 4, rowY + 1.7, x + width - 4, rowY + 1.7)
    rowY += 4.5
  })

  doc.setDrawColor(...mixRgb(brand, WHITE, 0.72))
  doc.setLineWidth(0.18)
  doc.line(x + 4, rowY + 0.8, x + width - 4, rowY + 0.8)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(5.8)
  doc.setTextColor(...brand)
  doc.text(highlightLabel.toUpperCase(), x + 4, rowY + 5)

  doc.setFontSize(15.8)
  doc.text(highlightValue, x + width - 4, rowY + 11.2, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(5.8)
  doc.setTextColor(...MUTED)
  doc.text(due > 0 ? "Outstanding amount payable." : "Final invoice total.", x + width - 4, y + height - 3.8, {
    align: "right",
    maxWidth: width - 8,
  })
}

function drawFooterOnAllPages(doc: jsPDF, data: InvoiceData, brand: RGB) {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const footerText = compact([safe(data.business.name, "My Business"), data.business.phone, data.business.email]).join("  |  ")

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.12)
    doc.line(PAGE_MARGIN, pageHeight - 7.4, pageWidth - PAGE_MARGIN, pageHeight - 7.4)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(5.8)
    doc.setTextColor(...MUTED)
    doc.text(trimForWidth(doc, footerText || safe(data.business.address, "Contact details not set"), 72), PAGE_MARGIN, pageHeight - 4.2)
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - PAGE_MARGIN, pageHeight - 4.2, { align: "right" })

    doc.setFillColor(...brand)
    doc.rect(0, pageHeight - BOTTOM_BAR_HEIGHT, pageWidth, BOTTOM_BAR_HEIGHT, "F")
  }
}

function estimateSummaryHeight(doc: jsPDF, data: InvoiceData) {
  const due = balanceDue(data)
  const rows = buildSummaryRows(data, due)
  const noteLines = fitTextLines(doc, safe(data.business.invoiceFooter, "Thank you for your business."), 64, data.notes ? 4 : 6).length
  const orderNoteLines = data.notes ? fitTextLines(doc, `Order note: ${data.notes}`, 64, 3).length + 1 : 0
  const noteHeight = 18 + (noteLines + orderNoteLines) * 3.2
  const totalsHeight = 18 + rows.length * 4.5 + 13
  return Math.max(36, Math.max(noteHeight, totalsHeight))
}

function buildSummaryRows(data: InvoiceData, due: number): TotalsRow[] {
  const rows: TotalsRow[] = [{ label: "Subtotal", value: money(data.currencySymbol, data.subtotal) }]
  if (Number(data.discount ?? 0) > 0) rows.push({ label: "Discount", value: `-${money(data.currencySymbol, data.discount ?? 0)}` })
  if (Number(data.tax ?? 0) > 0) rows.push({ label: "Tax", value: money(data.currencySymbol, data.tax ?? 0) })
  if (Number(data.shippingCharge ?? 0) > 0) rows.push({ label: "Delivery", value: money(data.currencySymbol, data.shippingCharge ?? 0) })
  if (due > 0) rows.push({ label: "Grand Total", value: money(data.currencySymbol, data.total) })
  if (Number(data.paidAmount ?? 0) > 0) rows.push({ label: "Paid", value: `-${money(data.currencySymbol, data.paidAmount ?? 0)}` })
  return rows
}

function balanceDue(data: InvoiceData) {
  return Math.max(0, Number(data.balanceDue ?? data.total - Number(data.paidAmount ?? 0)))
}

function itemDiscount(item: InvoiceData["items"][number]) {
  return Math.max(0, item.quantity * Number(item.unitPrice) - Number(item.totalPrice))
}

function money(prefix: string, value: number | undefined) {
  return `${prefix}${Number(value ?? 0).toFixed(2)}`
}

function paymentLabel(value?: string) {
  return safe(value, "Not specified")
}

function safe(value: string | undefined | null, fallback: string) {
  const text = String(value ?? "").trim()
  return text.length > 0 ? text : fallback
}

function compact(values: Array<string | undefined | null>) {
  return values.map((value) => String(value ?? "").trim()).filter(Boolean)
}

function titleCase(value: string) {
  const clean = String(value || "").replace(/[_-]+/g, " ").trim()
  if (!clean) return "N/A"
  return clean.replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
}

function initials(name: string) {
  const parts = compact(String(name || "My Business").split(/\s+/))
  return (parts[0]?.[0] ?? "M").toUpperCase()
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

function hexToRgb(value?: string): RGB | null {
  const raw = String(value ?? "").trim().replace(/^#/, "")
  const hex = raw.length === 3 ? raw.split("").map((char) => char + char).join("") : raw
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ]
}

function mixRgb(color: RGB, target: RGB, amount: number): RGB {
  return [
    Math.round(color[0] + (target[0] - color[0]) * amount),
    Math.round(color[1] + (target[1] - color[1]) * amount),
    Math.round(color[2] + (target[2] - color[2]) * amount),
  ]
}

async function loadLogo(src?: string): Promise<LogoAsset | null> {
  if (!src) return null
  try {
    if (src.startsWith("data:image/")) {
      if (src.startsWith("data:image/svg")) return null
      return { dataUrl: src, format: src.startsWith("data:image/png") ? "PNG" : "JPEG" }
    }

    const response = await fetch(src)
    if (!response.ok) return null
    const type = response.headers.get("content-type") ?? ""
    if (!type.startsWith("image/") || type.includes("svg")) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    return {
      dataUrl: `data:${type};base64,${buffer.toString("base64")}`,
      format: type.includes("png") ? "PNG" : "JPEG",
    }
  } catch {
    return null
  }
}
