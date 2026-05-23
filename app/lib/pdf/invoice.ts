import jsPDF from "jspdf"
import { InvoiceData } from "./types"
import { loadPdfLogo, type PdfLogoAsset } from "./assets"

type RGB = [number, number, number]
type LogoAsset = PdfLogoAsset

// Minimal Monochrome Palette
const INK: RGB = [0, 0, 0]
const TEXT: RGB = [20, 20, 20]
const MUTED: RGB = [100, 100, 100]
const BORDER: RGB = [220, 220, 220]
const LIGHT_BORDER: RGB = [240, 240, 240]

const PAGE_MARGIN = 20
const HEADER_Y = 20
const PARTY_Y = 60
const TABLE_Y = 105

export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  const start = Date.now();
  console.time(`[PDF Lib] Full generateInvoicePDF`);
  const doc = new jsPDF({ format: "a4", orientation: "portrait", unit: "mm", compress: false })
  const pageHeight = doc.internal.pageSize.getHeight()
  
  /* Logo fully disabled for performance
  console.time(`[PDF Lib] Load Logo`);
  const logo = await loadPdfLogo(data.business.logoUrl)
  console.timeEnd(`[PDF Lib] Load Logo`);
  */
  const logo = null;

  // Draw Page 1
  console.time(`[PDF Lib] Draw Header`);
  drawHeader(doc, data, logo)
  console.timeEnd(`[PDF Lib] Draw Header`);

  let y = drawTableHeader(doc, TABLE_Y)

  const items = data.items.length ? data.items : []
  
  console.time(`[PDF Lib] Manual Items Render`);
  for (const item of items) {
    const descLines = productDescriptionLines(doc, item, 90)
    const itemHeight = Math.max(10, descLines.length * 4.5 + 4)

    // Page break check
    if (y + itemHeight > pageHeight - 40) {
      drawFooter(doc, data, doc.getCurrentPageInfo().pageNumber)
      doc.addPage()
      drawMinimalHeader(doc, data)
      y = drawTableHeader(doc, 35)
    }

    y = drawItemRow(doc, item, y, data.currencySymbol, descLines)
  }
  console.timeEnd(`[PDF Lib] Manual Items Render`);

  // Summary Section
  console.time(`[PDF Lib] Draw Summary`);
  const summaryHeight = estimateSummaryHeight(data)
  if (y + summaryHeight > pageHeight - 30) {
    drawFooter(doc, data, doc.getCurrentPageInfo().pageNumber)
    doc.addPage()
    drawMinimalHeader(doc, data)
    y = 35
  }

  drawSummary(doc, data, y)
  console.timeEnd(`[PDF Lib] Draw Summary`);

  // Draw footers on all pages (last pass)
  console.time(`[PDF Lib] Footer Loop`);
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawFooter(doc, data, i, totalPages)
  }
  console.timeEnd(`[PDF Lib] Footer Loop`);

  console.time(`[PDF Lib] doc.output`);
  const output = doc.output("blob")
  console.timeEnd(`[PDF Lib] doc.output`);

  console.timeEnd(`[PDF Lib] Full generateInvoicePDF`);
  console.log(`[PDF Lib] Total Duration: ${Date.now() - start}ms`);
  return output
}

function drawHeader(doc: jsPDF, data: InvoiceData, logo: LogoAsset | null) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const rightX = pageWidth - PAGE_MARGIN

  // Logo replacement with text if logo is missing or disabled
  // We are DISABLING logo rendering to fix the 48s delay
  /*
  if (logo) {
    try {
      console.time(`[PDF Lib] addImage`);
      const size = imageFit(doc, logo.dataUrl, 25, 20)
      doc.addImage(logo.dataUrl, logo.format, PAGE_MARGIN, HEADER_Y, size.width, size.height)
      console.timeEnd(`[PDF Lib] addImage`);
    } catch (e) {
      console.error(`[PDF Lib] addImage error:`, e);
    }
  }
  */

  // Business Info (Primary Identity)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14) // Increased size for better identity without logo
  doc.setTextColor(...INK)
  doc.text(safe(data.business.name, "BUSINESS"), PAGE_MARGIN, HEADER_Y + 5)
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  const busLines = businessContactLines(data)
  busLines.forEach((line, i) => {
    doc.text(line, PAGE_MARGIN, HEADER_Y + 10 + i * 4)
  })

  // Title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(24)
  doc.setTextColor(...INK)
  doc.text("INVOICE", PAGE_MARGIN, HEADER_Y + 35)

  // Meta
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text("Invoice No:", PAGE_MARGIN, HEADER_Y + 44)
  doc.setTextColor(...TEXT)
  doc.text(safe(data.invoiceNumber, "N/A"), PAGE_MARGIN + 20, HEADER_Y + 44)

  doc.setTextColor(...MUTED)
  doc.text("Date:", PAGE_MARGIN + 60, HEADER_Y + 44)
  doc.setTextColor(...TEXT)
  doc.text(safe(data.date, "N/A"), PAGE_MARGIN + 72, HEADER_Y + 44)

  // Divider
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.line(PAGE_MARGIN, PARTY_Y, pageWidth - PAGE_MARGIN, PARTY_Y)

  // Parties
  drawPartyBlock(doc, PAGE_MARGIN, PARTY_Y + 8, "BILL TO", safe(data.customer.name, "Walk-in Customer"), compact([
    data.customer.phone,
    data.customer.email,
    data.customer.billingAddress,
  ]))

  const statusX = pageWidth - PAGE_MARGIN - 60
  const paymentStatus = titleCase(data.paymentStatus ?? (balanceDue(data) > 0 ? "partial" : "paid"))
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text("PAYMENT STATUS", statusX, PARTY_Y + 8)
  
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text(paymentStatus.toUpperCase(), statusX, PARTY_Y + 14)

  if (data.paymentMethod) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...TEXT)
    doc.text(`via ${data.paymentMethod}`, statusX, PARTY_Y + 19)
  }

  doc.line(PAGE_MARGIN, PARTY_Y + 32, pageWidth - PAGE_MARGIN, PARTY_Y + 32)
}

function drawMinimalHeader(doc: jsPDF, data: InvoiceData) {
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text(`INVOICE: ${data.invoiceNumber}`, PAGE_MARGIN, 20)
  
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.line(PAGE_MARGIN, 24, pageWidth - PAGE_MARGIN, 24)
}

function drawPartyBlock(doc: jsPDF, x: number, y: number, label: string, name: string, lines: string[]) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(label, x, y)
  
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text(name, x, y + 6)
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...TEXT)
  lines.slice(0, 3).forEach((line, i) => {
    doc.text(line, x, y + 11 + i * 4.5, { maxWidth: 90 })
  })
}

function drawTableHeader(doc: jsPDF, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  
  doc.text("Description", PAGE_MARGIN, y)
  doc.text("Qty", PAGE_MARGIN + contentWidth * 0.55, y, { align: "center" })
  doc.text("Price", PAGE_MARGIN + contentWidth * 0.78, y, { align: "right" })
  doc.text("Amount", PAGE_MARGIN + contentWidth, y, { align: "right" })
  
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.3)
  doc.line(PAGE_MARGIN, y + 2, PAGE_MARGIN + contentWidth, y + 2)
  
  return y + 8
}

function drawItemRow(doc: jsPDF, item: any, y: number, currency: string, descLines: string[]) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  const rowHeight = Math.max(8, descLines.length * 4.5 + 4)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...TEXT)
  
  doc.text(descLines, PAGE_MARGIN, y)
  doc.text(String(item.quantity), PAGE_MARGIN + contentWidth * 0.55, y, { align: "center" })
  doc.text(money(currency, item.unitPrice), PAGE_MARGIN + contentWidth * 0.78, y, { align: "right" })
  
  doc.setFont("helvetica", "bold")
  doc.text(money(currency, item.totalPrice), PAGE_MARGIN + contentWidth, y, { align: "right" })
  
  doc.setDrawColor(...LIGHT_BORDER)
  doc.setLineWidth(0.1)
  doc.line(PAGE_MARGIN, y + rowHeight - 2, PAGE_MARGIN + contentWidth, y + rowHeight - 2)
  
  return y + rowHeight
}

function drawSummary(doc: jsPDF, data: InvoiceData, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const rightX = pageWidth - PAGE_MARGIN
  const labelX = rightX - 60

  // Totals Divider
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.5)
  doc.line(labelX, y, rightX, y)
  y += 8

  const totals = [
    ["Subtotal", data.subtotal],
    ["Discount", data.discount],
    ["Shipping", data.shippingCharge],
    ["Tax", data.tax],
  ].filter(([_, val]) => Number(val ?? 0) !== 0 || _ === "Subtotal")

  totals.forEach(([label, val]) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text(String(label), labelX, y)
    
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...TEXT)
    doc.text(money(data.currencySymbol, Number(val ?? 0)), rightX, y, { align: "right" })
    y += 6
  })

  // Grand Total
  y += 2
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.line(labelX, y - 4, rightX, y - 4)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(...INK)
  doc.text("Total", labelX, y)
  doc.text(money(data.currencySymbol, data.total), rightX, y, { align: "right" })
  y += 8

  // Paid/Balance
  if (Number(data.paidAmount ?? 0) > 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text("Amount Paid", labelX, y)
    doc.text(`-${money(data.currencySymbol, data.paidAmount)}`, rightX, y, { align: "right" })
    y += 6
  }

  const due = balanceDue(data)
  if (due > 0) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(...INK)
    doc.text("Balance Due", labelX, y)
    doc.text(money(data.currencySymbol, due), rightX, y, { align: "right" })
  }

  // Notes (Left)
  if (data.notes || data.business.invoiceFooter) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text("NOTES", PAGE_MARGIN, y - 10)
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...TEXT)
    const notes = compact([data.notes, data.business.invoiceFooter]).join("\n\n")
    doc.text(notes, PAGE_MARGIN, y - 4, { maxWidth: 100 })
  }
}

function drawFooter(doc: jsPDF, data: InvoiceData, page: number, total?: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  
  const footerText = `${safe(data.business.name, "Business")} | Invoice: ${data.invoiceNumber}`
  doc.text(footerText, PAGE_MARGIN, pageHeight - 15)
  if (total) {
    doc.text(`Page ${page} of ${total}`, pageWidth - PAGE_MARGIN, pageHeight - 15, { align: "right" })
  }
}

function productDescriptionLines(doc: jsPDF, item: any, maxWidth: number) {
  const lines = [safe(item.name, "Item")]
  if (item.variantLabel) lines.push(`Variant: ${item.variantLabel}`)
  if (item.sku) lines.push(`SKU: ${item.sku}`)
  
  return doc.splitTextToSize(lines.join("\n"), maxWidth) as string[]
}

function businessContactLines(data: InvoiceData) {
  return compact([
    data.business.address,
    data.business.phone,
    data.business.email,
    data.business.taxId ? `Tax ID: ${data.business.taxId}` : undefined,
  ])
}

function estimateSummaryHeight(data: InvoiceData) {
  let h = 40
  if (Number(data.paidAmount ?? 0) > 0) h += 6
  if (balanceDue(data) > 0) h += 6
  return h
}

function balanceDue(data: InvoiceData) {
  return Math.max(0, Number(data.balanceDue ?? data.total - Number(data.paidAmount ?? 0)))
}

function money(prefix: string, value: number | string | undefined) {
  return `${prefix}${Number(value ?? 0).toFixed(2)}`
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
