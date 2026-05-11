import jsPDF from "jspdf"
import { ReceiptData } from "./types"

export async function generateReceiptPDF(data: ReceiptData): Promise<Blob> {
  const doc = new jsPDF({
    format: [80, 220],
    orientation: "portrait",
    unit: "mm"
  })

  const pageWidth = 80
  const brandColor: [number, number, number] = [196, 151, 58]
  let y = 8

  // Business name
  doc.setFillColor(...brandColor)
  doc.rect(0, 0, pageWidth, 18, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(data.business.name, pageWidth / 2, 8, { align: "center" })
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  if (data.business.address) {
    doc.text(data.business.address, pageWidth / 2, 13, { align: "center" })
  }

  y = 24

  doc.setTextColor(50, 50, 50)
  doc.setFontSize(7.5)
  doc.text(`Receipt: ${data.receiptId}`, 5, y); y += 4
  doc.text(`Date: ${data.date}`, 5, y); y += 4
  if (data.customer) {
    doc.text(`Customer: ${data.customer.name}`, 5, y); y += 4
  }

  doc.setDrawColor(200, 200, 200)
  doc.line(5, y, pageWidth - 5, y)
  y += 4

  // Header row
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(150, 150, 150)
  doc.text("ITEM", 5, y)
  doc.text("QTY", 42, y, { align: "center" })
  doc.text("PRICE", pageWidth - 5, y, { align: "right" })
  y += 4

  doc.setDrawColor(200, 200, 200)
  doc.line(5, y, pageWidth - 5, y)
  y += 3

  // Items
  data.items.forEach(item => {
    doc.setFont("helvetica", "normal")
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(7.5)
    doc.text(item.name, 5, y, { maxWidth: 32 })
    doc.text(item.quantity.toString(), 42, y, { align: "center" })
    doc.text(
      `${data.currencySymbol}${Number(item.total).toFixed(2)}`,
      pageWidth - 5, y, { align: "right" }
    )
    y += 6
  })

  doc.line(5, y, pageWidth - 5, y)
  y += 4

  // Totals
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)

  doc.text("Subtotal:", 5, y)
  doc.text(`${data.currencySymbol}${Number(data.subtotal).toFixed(2)}`, pageWidth - 5, y, { align: "right" })
  y += 4

  if (data.discount && Number(data.discount) > 0) {
    doc.text("Discount:", 5, y)
    doc.setTextColor(220, 38, 38)
    doc.text(`-${data.currencySymbol}${Number(data.discount).toFixed(2)}`, pageWidth - 5, y, { align: "right" })
    doc.setTextColor(80, 80, 80)
    y += 4
  }

  if (data.tax && Number(data.tax) > 0) {
    doc.text("Tax:", 5, y)
    doc.text(`${data.currencySymbol}${Number(data.tax).toFixed(2)}`, pageWidth - 5, y, { align: "right" })
    y += 4
  }

  // Total highlight
  doc.setFillColor(...brandColor)
  doc.rect(5, y, pageWidth - 10, 10, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("TOTAL", 10, y + 7)
  doc.text(`${data.currencySymbol}${Number(data.total).toFixed(2)}`, pageWidth - 10, y + 7, { align: "right" })
  y += 14

  doc.setTextColor(60, 60, 60)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.text(`Payment: ${data.paymentMethod}`, 5, y); y += 4

  if (data.paidAmount) {
    doc.text(`Paid: ${data.currencySymbol}${Number(data.paidAmount).toFixed(2)}`, 5, y); y += 4
  }
  if (data.change && Number(data.change) > 0) {
    doc.setFont("helvetica", "bold")
    doc.text(`Change: ${data.currencySymbol}${Number(data.change).toFixed(2)}`, 5, y)
    doc.setFont("helvetica", "normal")
    y += 4
  }

  // Thank you
  y += 4
  doc.setDrawColor(200, 200, 200)
  doc.line(5, y, pageWidth - 5, y)
  y += 6

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...brandColor)
  doc.text("Thank You!", pageWidth / 2, y, { align: "center" })
  y += 5
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(150, 150, 150)
  doc.text("Come again.", pageWidth / 2, y, { align: "center" })

  if (data.business.invoiceFooter) {
    y += 6
    doc.setFontSize(6.5)
    doc.text(data.business.invoiceFooter, pageWidth / 2, y, { align: "center", maxWidth: pageWidth - 10 })
  }

  return doc.output("blob")
}