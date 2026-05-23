import jsPDF from "jspdf"
import { autoTable } from "jspdf-autotable"
import { DeliverySlipData } from "./types"

type RGB = [number, number, number]

const INK: RGB = [15, 23, 42]
const TEXT: RGB = [30, 41, 59]
const MUTED: RGB = [100, 116, 139]
const BORDER: RGB = [203, 213, 225]
const SOFT: RGB = [248, 250, 252]
const WHITE: RGB = [255, 255, 255]

const PAGE_MARGIN = 14
const HEADER_Y = 14
const TABLE_Y = 102

export async function generateDeliverySlipPDF(data: DeliverySlipData): Promise<Blob> {
  const doc = new jsPDF({ format: "a4", orientation: "portrait", unit: "mm" })
  const pageHeight = doc.internal.pageSize.getHeight()
  const tableItems = data.items.length
    ? data.items
    : [{ name: "No items available", quantity: 0, unit: "" }]

  drawFirstPageHeader(doc, data)

  autoTable(doc, {
    startY: TABLE_Y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: 26, bottom: 44 },
    pageBreak: "auto",
    rowPageBreak: "avoid",
    showHead: "everyPage",
    head: [["#", "Item Details", "Qty", "Unit"]],
    body: tableItems.map((item, index) => [
      item.quantity > 0 ? String(index + 1) : "",
      productDescription(item),
      item.quantity > 0 ? String(item.quantity) : "",
      item.unit,
    ]),
    willDrawPage: (hook: any) => {
      if (hook.pageNumber > 1) drawContinuationHeader(doc, data)
    },
    headStyles: {
      fillColor: INK,
      textColor: WHITE,
      font: "helvetica",
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 2.8, right: 2.8, bottom: 2.8, left: 2.8 },
      lineWidth: 0,
    },
    bodyStyles: {
      font: "helvetica",
      fontSize: 8.9,
      textColor: TEXT,
      cellPadding: { top: 3, right: 2.8, bottom: 3, left: 2.8 },
      lineColor: BORDER,
      lineWidth: { bottom: 0.12 },
    },
    alternateRowStyles: { fillColor: SOFT },
    styles: {
      overflow: "linebreak",
      valign: "top",
      minCellHeight: 8.4,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 11 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 18, fontStyle: "bold" },
      3: { halign: "center", cellWidth: 24 },
    },
    didParseCell: (hook) => {
      if (hook.section === "body" && !data.items.length) {
        hook.cell.styles.textColor = MUTED
        if (hook.column.index === 1) hook.cell.styles.halign = "center"
      }
    },
  })

  let y = ((doc as any).lastAutoTable?.finalY ?? TABLE_Y) + 7
  if (y + 54 > pageHeight - 16) {
    doc.addPage()
    drawContinuationHeader(doc, data)
    y = 30
  }

  y = drawInstructions(doc, data, y)
  drawSignatureArea(doc, y)
  drawFooterOnAllPages(doc, data)

  return doc.output("blob")
}

function drawFirstPageHeader(doc: jsPDF, data: DeliverySlipData) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  const rightX = pageWidth - PAGE_MARGIN
  const businessLines = compact([
    data.business.address,
    compact([data.business.phone, data.business.email]).join(" | "),
  ])

  doc.setFillColor(...WHITE)
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(19)
  doc.setTextColor(...INK)
  doc.text("DELIVERY SLIP", PAGE_MARGIN, HEADER_Y)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.8)
  doc.setTextColor(...MUTED)
  doc.text(trimForWidth(doc, safe(data.business.name, "My Business"), 94), PAGE_MARGIN, HEADER_Y + 7)

  doc.setFontSize(7.2)
  businessLines.slice(0, 2).forEach((line, index) => {
    doc.text(trimForWidth(doc, line, 104), PAGE_MARGIN, HEADER_Y + 12 + index * 3.7)
  })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT)
  doc.text(`Slip: ${safe(data.slipNumber, data.orderId)}`, rightX, HEADER_Y - 1, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...MUTED)
  doc.text(`Date: ${safe(data.date, "N/A")}`, rightX, HEADER_Y + 5, { align: "right" })

  doc.setDrawColor(...INK)
  doc.setLineWidth(0.45)
  doc.line(PAGE_MARGIN, HEADER_Y + 22, PAGE_MARGIN + contentWidth, HEADER_Y + 22)

  drawRecipientBlock(doc, data, PAGE_MARGIN, HEADER_Y + 29, 116, 48)
  drawOrderBlock(doc, data, PAGE_MARGIN + 122, HEADER_Y + 29, contentWidth - 122, 48)
}

function drawRecipientBlock(doc: jsPDF, data: DeliverySlipData, x: number, y: number, width: number, height: number) {
  doc.setFillColor(...WHITE)
  doc.setDrawColor(...BORDER)
  doc.roundedRect(x, y, width, height, 1.5, 1.5, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text("DELIVER TO", x + 4, y + 6)

  doc.setFontSize(14)
  doc.setTextColor(...INK)
  doc.text(trimForWidth(doc, safe(data.customer.name, "Customer"), width - 8), x + 4, y + 15)

  let lineY = y + 24
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.4)
  doc.setTextColor(...TEXT)
  if (data.customer.phone) {
    doc.text(`Phone: ${data.customer.phone}`, x + 4, lineY)
    lineY += 6
  }

  doc.setTextColor(...MUTED)
  doc.setFontSize(9)
  const addressLines = fitTextLines(doc, safe(data.customer.shippingAddress, "N/A"), width - 8, 4)
  doc.text(addressLines, x + 4, lineY, { maxWidth: width - 8 })
}

function drawOrderBlock(doc: jsPDF, data: DeliverySlipData, x: number, y: number, width: number, height: number) {
  const cod = Number(data.codAmount ?? 0)

  doc.setFillColor(...SOFT)
  doc.setDrawColor(...BORDER)
  doc.roundedRect(x, y, width, height, 1.5, 1.5, "FD")

  drawKeyValue(doc, x, y + 6, width, "Order No", safe(data.orderId, "N/A"), true)
  drawKeyValue(doc, x, y + 14, width, "Status", titleCase(data.deliveryStatus ?? "pending"), false)
  drawKeyValue(doc, x, y + 22, width, "Method", safe(data.deliveryMethod, "Standard Delivery"), false)

  doc.setDrawColor(...BORDER)
  doc.line(x + 4, y + 28, x + width - 4, y + 28)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...MUTED)
  doc.text("COD AMOUNT", x + 4, y + 36)

  doc.setFontSize(13)
  doc.setTextColor(...INK)
  doc.text(cod > 0 ? money(data.currencySymbol, cod) : "None", x + width - 4, y + 37, { align: "right" })
}

function drawKeyValue(doc: jsPDF, x: number, y: number, width: number, label: string, value: string, strong: boolean) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.6)
  doc.setTextColor(...MUTED)
  doc.text(label, x + 4, y)

  doc.setFont("helvetica", strong ? "bold" : "normal")
  doc.setFontSize(strong ? 9.1 : 8.5)
  doc.setTextColor(...TEXT)
  doc.text(trimForWidth(doc, value, width - 28), x + width - 4, y, { align: "right" })
}

function drawContinuationHeader(doc: jsPDF, data: DeliverySlipData) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...WHITE)
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text("DELIVERY SLIP", PAGE_MARGIN, 14)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text(`Order: ${safe(data.orderId, "N/A")}`, pageWidth - PAGE_MARGIN, 14, { align: "right" })

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.16)
  doc.line(PAGE_MARGIN, 19, pageWidth - PAGE_MARGIN, 19)
}

function drawInstructions(doc: jsPDF, data: DeliverySlipData, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const width = pageWidth - PAGE_MARGIN * 2
  const notes = safe(data.notes, "No special delivery instructions.")

  doc.setFillColor(...SOFT)
  doc.setDrawColor(...BORDER)
  doc.roundedRect(PAGE_MARGIN, y, width, 22, 1.5, 1.5, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.2)
  doc.setTextColor(...INK)
  doc.text("DELIVERY NOTES / INSTRUCTIONS", PAGE_MARGIN + 4, y + 5.5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...TEXT)
  doc.text(fitTextLines(doc, notes, width - 8, 3), PAGE_MARGIN + 4, y + 11, { maxWidth: width - 8 })

  return y + 29
}

function drawSignatureArea(doc: jsPDF, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const width = pageWidth - PAGE_MARGIN * 2
  const gap = 8
  const colWidth = (width - gap * 2) / 3
  const labels = ["Prepared By", "Courier", "Received By"]

  labels.forEach((label, index) => {
    const x = PAGE_MARGIN + index * (colWidth + gap)
    doc.setDrawColor(...TEXT)
    doc.setLineWidth(0.18)
    doc.line(x, y + 13, x + colWidth, y + 13)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.4)
    doc.setTextColor(...MUTED)
    doc.text(label, x, y + 18)
  })
}

function drawFooterOnAllPages(doc: jsPDF, data: DeliverySlipData) {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contact = compact([safe(data.business.name, "My Business"), data.business.phone, data.business.email, data.business.address]).join(" | ")

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.14)
    doc.line(PAGE_MARGIN, pageHeight - 12, pageWidth - PAGE_MARGIN, pageHeight - 12)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(trimForWidth(doc, contact, 125), PAGE_MARGIN, pageHeight - 7)
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - PAGE_MARGIN, pageHeight - 7, { align: "right" })
  }
}

function productDescription(item: DeliverySlipData["items"][number]) {
  const meta = compact([
    item.variantLabel ? `Variant: ${item.variantLabel}` : undefined,
    item.sku ? `SKU: ${item.sku}` : undefined,
  ]).join("\n")

  return meta ? `${safe(item.name, "Item")}\n${meta}` : safe(item.name, "Item")
}

function money(prefix: string | undefined, value: number | undefined) {
  return `${prefix ?? ""}${Number(value ?? 0).toFixed(2)}`
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
