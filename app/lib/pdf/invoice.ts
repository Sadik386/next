import jsPDF from "jspdf"
import { autoTable } from "jspdf-autotable"
import { InvoiceData } from "./types"

export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  const doc = new jsPDF({ format: "a5", orientation: "portrait" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const brandColor: [number, number, number] = [196, 151, 58]
  const brandDark: [number, number, number] = [160, 120, 40]
  let y = 15

  // === HEADER BAR ===
  doc.setFillColor(...brandColor)
  doc.rect(0, 0, pageWidth, 22, "F")

  // Business name on left
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text(data.business.name, 14, 10)

  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  if (data.business.phone) doc.text(`Tel: ${data.business.phone}`, 14, 16)

  // INVOICE label right
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("INVOICE", pageWidth - 14, 10, { align: "right" })
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(`#${data.invoiceNumber}`, pageWidth - 14, 16, { align: "right" })

  y = 27

  // === META ROW: dates + status ===
  const metaBgY = y
  doc.setFillColor(248, 247, 245)
  doc.rect(0, metaBgY, pageWidth, pageHeight - metaBgY - 10, "F")

  // Left: business contact
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("FROM", 14, y + 5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(7.5)
  let cx = y + 9
  if (data.business.address) { doc.text(data.business.address, 14, cx); cx += 4 }
  if (data.business.email) { doc.text(data.business.email, 14, cx); cx += 4 }
  if (data.business.taxId) { doc.text(`Tax ID: ${data.business.taxId}`, 14, cx); cx += 4 }

  // Right: invoice meta
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(7.5)
  doc.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - 14, y + 5, { align: "right" })
  doc.text(`Date: ${data.date}`, pageWidth - 14, y + 10, { align: "right" })
  if (data.dueDate) doc.text(`Due: ${data.dueDate}`, pageWidth - 14, y + 15, { align: "right" })

  y += Math.max(cx - y, 22)

  // === CUSTOMER BOX ===
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(brandColor[0] - 60, brandColor[1] - 50, brandColor[2] - 40)
  doc.roundedRect(14, y, pageWidth - 28, 32, 2, 2, "FD")

  doc.setTextColor(brandColor[0] - 40, brandColor[1] - 30, brandColor[2] - 20)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.text("BILL TO", 19, y + 7)

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(9.5)
  doc.setFont("helvetica", "bold")
  doc.text(data.customer.name, 19, y + 14)

  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  let by = y + 20
  if (data.customer.email) { doc.text(data.customer.email, 19, by); by += 4 }
  if (data.customer.phone) { doc.text(data.customer.phone, 19, by); by += 4 }

  if (data.customer.billingAddress) {
    doc.text(data.customer.billingAddress, pageWidth / 2 + 2, y + 14, { maxWidth: pageWidth / 2 - 22 })
  }

  // Shipping on bottom right of box
  if (data.customer.shippingAddress) {
    doc.setTextColor(brandColor[0] - 40, brandColor[1] - 30, brandColor[2] - 20)
    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.text("SHIP TO", pageWidth / 2 + 2, y + 7)
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.text(data.customer.shippingAddress, pageWidth / 2 + 2, y + 14, { maxWidth: pageWidth / 2 - 22 })
  }

  y += 38

  // === PAYMENT INFO ROW ===
  if (data.paymentMethod || data.customer) {
    doc.setFillColor(...brandColor)
    doc.roundedRect(14, y, pageWidth - 28, 8, 1, 1, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "bold")
    doc.text("PAYMENT", 19, y + 5.5)
    doc.setFont("helvetica", "normal")
    doc.text(data.paymentMethod || "N/A", 52, y + 5.5)
    if (data.paidAmount !== undefined) {
      doc.setFont("helvetica", "bold")
      doc.text("PAID", pageWidth / 2, y + 5.5)
      doc.text(`${data.currencySymbol}${Number(data.paidAmount).toFixed(2)}`, pageWidth / 2 + 18, y + 5.5)
    }
    if (data.balanceDue && Number(data.balanceDue) > 0) {
      doc.setTextColor(255, 220, 180)
      doc.text("BALANCE", pageWidth - 55, y + 5.5)
      doc.text(`${data.currencySymbol}${Number(data.balanceDue).toFixed(2)}`, pageWidth - 19, y + 5.5, { align: "right" })
    }
    y += 12
  }

  // === ITEMS TABLE ===
  autoTable(doc, {
    startY: y,
    head: [["#", "Description", "Qty", "Unit Price", "Discount", "Total"]],
    body: data.items.map((item, i) => [
      (i + 1).toString(),
      item.name,
      item.quantity.toString(),
      `${data.currencySymbol}${Number(item.unitPrice).toFixed(2)}`,
      item.totalPrice !== item.quantity * Number(item.unitPrice)
        ? `${data.currencySymbol}${(item.quantity * Number(item.unitPrice) - Number(item.totalPrice)).toFixed(2)}`
        : "—",
      `${data.currencySymbol}${Number(item.totalPrice).toFixed(2)}`,
    ]),
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: brandColor,
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 3.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: { fillColor: [252, 250, 247] },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 14 },
      3: { halign: "right", cellWidth: 26 },
      4: { halign: "right", cellWidth: 22 },
      5: { halign: "right", cellWidth: 26 },
    },
  } as any)

  y = (doc as any).lastAutoTable.finalY + 5

  // === TOTALS BOX ===
  const tx = pageWidth - 14
  const lx = tx - 50

  doc.setFillColor(248, 247, 245)
  doc.roundedRect(lx - 5, y, 60, 40, 2, 2, "F")

  const line = (label: string, value: string, bold = false, highlight = false) => {
    if (highlight) {
      doc.setFillColor(...brandColor)
      doc.roundedRect(lx - 4, y, tx - lx + 8, 8, 1, 1, "F")
      doc.setTextColor(255, 255, 255)
    } else {
      doc.setTextColor(100, 100, 100)
    }
    doc.setFontSize(8)
    doc.setFont("helvetica", bold ? "bold" : "normal")
    doc.text(label, lx, y + 5)
    doc.text(value, tx, y + 5, { align: "right" })
    if (!highlight) doc.setTextColor(100, 100, 100)
    y += 8
  }

  line("Subtotal", `${data.currencySymbol}${Number(data.subtotal).toFixed(2)}`)
  if (data.discount && Number(data.discount) > 0) {
    line("Discount", `-${data.currencySymbol}${Number(data.discount).toFixed(2)}`)
  }
  if (data.tax && Number(data.tax) > 0) {
    line("Tax", `${data.currencySymbol}${Number(data.tax).toFixed(2)}`)
  }
  line("", "", true, true)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("TOTAL", lx, y - 3)
  doc.text(`${data.currencySymbol}${Number(data.total).toFixed(2)}`, tx, y - 3, { align: "right" })

  y += 6

  // === NOTES ===
  if (data.notes) {
    doc.setFillColor(252, 250, 247)
    doc.roundedRect(14, y, pageWidth - 28, 12, 2, 2, "F")
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "italic")
    doc.text(`Note: ${data.notes}`, 19, y + 7, { maxWidth: pageWidth - 36 })
    y += 16
  }

  // === FOOTER ===
  doc.setDrawColor(brandColor[0] - 60, brandColor[1] - 50, brandColor[2] - 40)
  doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18)

  if (data.business.invoiceFooter) {
    doc.setTextColor(180, 180, 180)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "normal")
    doc.text(data.business.invoiceFooter, pageWidth / 2, pageHeight - 12, { align: "center", maxWidth: pageWidth - 28 })
  }

  // Signature line
  doc.setTextColor(150, 150, 150)
  doc.setFontSize(7)
  doc.text("Authorized Signature", 14, pageHeight - 8)

  return doc.output("blob")
}