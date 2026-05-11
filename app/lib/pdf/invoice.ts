import jsPDF from "jspdf"
import { autoTable } from "jspdf-autotable"
import { InvoiceData } from "./types"

export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  const doc = new jsPDF({ format: "a5", orientation: "portrait" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const brandColor: [number, number, number] = [196, 151, 58]
  let y = 15

  // Header background
  doc.setFillColor(...brandColor)
  doc.rect(0, 0, pageWidth, 28, "F")

  // Business name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(data.business.name, 15, 12)

  // INVOICE label
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("INVOICE", pageWidth - 15, 10, { align: "right" })
  doc.setFontSize(8)
  doc.text(`#${data.invoiceNumber}`, pageWidth - 15, 16, { align: "right" })
  doc.text(`Date: ${data.date}`, pageWidth - 15, 22, { align: "right" })

  y = 35

  // Business info
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  if (data.business.address) { doc.text(data.business.address, 15, y); y += 4 }
  if (data.business.phone) { doc.text(`Tel: ${data.business.phone}`, 15, y); y += 4 }
  if (data.business.email) { doc.text(`Email: ${data.business.email}`, 15, y); y += 4 }
  if (data.business.taxId) { doc.text(`Tax ID: ${data.business.taxId}`, 15, y); y += 4 }

  y += 4

  // Bill To box
  doc.setFillColor(248, 247, 245)
  doc.roundedRect(15, y, pageWidth - 30, 28, 2, 2, "F")

  doc.setTextColor(150, 150, 150)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.text("BILL TO", 19, y + 6)

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text(data.customer.name, 19, y + 12)

  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  let cy = y + 18
  if (data.customer.email) { doc.text(data.customer.email, 19, cy); cy += 4 }
  if (data.customer.phone) { doc.text(data.customer.phone, 19, cy); cy += 4 }
  if (data.customer.billingAddress) {
    doc.text(data.customer.billingAddress, pageWidth / 2, y + 12, { maxWidth: pageWidth / 2 - 20 })
  }

  y += 34

  // Items table
  const tableData = data.items.map(item => [
    item.name,
    item.quantity.toString(),
    `${data.currencySymbol}${Number(item.unitPrice).toFixed(2)}`,
    `${data.currencySymbol}${Number(item.totalPrice).toFixed(2)}`
  ])

  autoTable(doc, {
    startY: y,
    head: [["Description", "Qty", "Unit Price", "Total"]],
    body: tableData,
    margin: { left: 15, right: 15 },
    headStyles: {
      fillColor: brandColor,
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 4,
    },
    bodyStyles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [252, 250, 247] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 15 },
      2: { halign: "right", cellWidth: 30 },
      3: { halign: "right", cellWidth: 30 },
    }
  })

  y = (doc as jsPDF).lastAutoTable!.finalY + 6

  // Totals
  const totalsX = pageWidth - 15
  const labelX = totalsX - 45

  doc.setFontSize(8.5)
  doc.setTextColor(100, 100, 100)
  doc.setFont("helvetica", "normal")

  doc.text("Subtotal:", labelX, y)
  doc.text(`${data.currencySymbol}${Number(data.subtotal).toFixed(2)}`, totalsX, y, { align: "right" })
  y += 5

  if (data.discount && Number(data.discount) > 0) {
    doc.text("Discount:", labelX, y)
    doc.setTextColor(220, 38, 38)
    doc.text(`-${data.currencySymbol}${Number(data.discount).toFixed(2)}`, totalsX, y, { align: "right" })
    doc.setTextColor(100, 100, 100)
    y += 5
  }

  if (data.tax && Number(data.tax) > 0) {
    doc.text("Tax:", labelX, y)
    doc.text(`${data.currencySymbol}${Number(data.tax).toFixed(2)}`, totalsX, y, { align: "right" })
    y += 5
  }

  // Total box
  doc.setFillColor(...brandColor)
  doc.roundedRect(labelX - 5, y, totalsX - labelX + 10, 10, 2, 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("TOTAL:", labelX, y + 7)
  doc.text(`${data.currencySymbol}${Number(data.total).toFixed(2)}`, totalsX, y + 7, { align: "right" })
  y += 16

  // Payment info
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")

  if (data.paymentMethod) {
    doc.text(`Payment Method: ${data.paymentMethod}`, 15, y); y += 5
  }
  if (data.paidAmount !== undefined) {
    doc.text(`Amount Paid: ${data.currencySymbol}${Number(data.paidAmount).toFixed(2)}`, 15, y); y += 5
  }
  if (data.balanceDue && Number(data.balanceDue) > 0) {
    doc.setTextColor(220, 38, 38)
    doc.setFont("helvetica", "bold")
    doc.text(`Balance Due: ${data.currencySymbol}${Number(data.balanceDue).toFixed(2)}`, 15, y)
    doc.setTextColor(100, 100, 100)
    doc.setFont("helvetica", "normal")
    y += 5
  }

  if (data.notes) {
    y += 3
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "italic")
    doc.text(`Note: ${data.notes}`, 15, y, { maxWidth: pageWidth - 30 })
    y += 6
  }

  // Footer
  if (data.business.invoiceFooter) {
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setDrawColor(200, 200, 200)
    doc.line(15, pageHeight - 14, pageWidth - 15, pageHeight - 14)
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(180, 180, 180)
    doc.text(data.business.invoiceFooter, pageWidth / 2, pageHeight - 8, { align: "center" })
  }

  return doc.output("blob")
}