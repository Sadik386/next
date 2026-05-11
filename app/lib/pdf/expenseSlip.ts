import jsPDF from "jspdf"
import { ExpenseSlipData } from "./types"

export async function generateExpenseSlipPDF(data: ExpenseSlipData): Promise<Blob> {
  const doc = new jsPDF({ format: "a5", orientation: "portrait" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const brandColor: [number, number, number] = [196, 151, 58]
  let y = 15

  // Header
  doc.setFillColor(...brandColor)
  doc.rect(0, 0, pageWidth, 22, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text("EXPENSE VOUCHER", pageWidth / 2, 14, { align: "center" })

  y = 32

  // Business info
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(data.business.name, 15, y)
  y += 5

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  if (data.business.address) { doc.text(data.business.address, 15, y); y += 4 }
  if (data.business.phone) { doc.text(`Tel: ${data.business.phone}`, 15, y); y += 4 }

  // Expense ID + Date on right
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(8)
  doc.text(`Voucher #: ${data.expenseId}`, pageWidth - 15, 32, { align: "right" })
  doc.text(`Date: ${data.date}`, pageWidth - 15, 38, { align: "right" })

  y += 4
  doc.setDrawColor(220, 220, 220)
  doc.line(15, y, pageWidth - 15, y)
  y += 8

  // Expense details box
  doc.setFillColor(248, 247, 245)
  doc.roundedRect(15, y, pageWidth - 30, 55, 2, 2, "F")

  const col1 = 19
  const col2 = pageWidth / 2 + 5
  let ry = y + 8

  const field = (label: string, value: string, x: number, yPos: number) => {
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(150, 150, 150)
    doc.text(label.toUpperCase(), x, yPos)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 30, 30)
    doc.text(value, x, yPos + 5)
  }

  field("Category", data.category, col1, ry)
  field("Vendor / Merchant", data.vendor, col2, ry)
  ry += 14

  field("Payment Method", data.paymentMethod, col1, ry)
  field("Currency", data.currency, col2, ry)
  ry += 14

  if (data.receiptId) field("Receipt ID", data.receiptId, col1, ry)
  if (data.referenceNo) field("Reference #", data.referenceNo, col2, ry)
  ry += 14

  y += 62

  // Amount highlight box
  doc.setFillColor(...brandColor)
  doc.roundedRect(15, y, pageWidth - 30, 18, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("TOTAL AMOUNT", 20, y + 7)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(
    `${data.currencySymbol}${Number(data.amount).toFixed(2)}`,
    pageWidth - 20, y + 12, { align: "right" }
  )
  y += 24

  if (data.taxAmount && Number(data.taxAmount) > 0) {
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(
      `Tax: ${data.currencySymbol}${Number(data.taxAmount).toFixed(2)}`,
      15, y
    )
    y += 6
  }

  if (data.description) {
    y += 2
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 80, 80)
    doc.text(`Description: ${data.description}`, 15, y, { maxWidth: pageWidth - 30 })
    y += 8
  }

  if (data.notes) {
    doc.setFont("helvetica", "italic")
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(7.5)
    doc.text(`Note: ${data.notes}`, 15, y, { maxWidth: pageWidth - 30 })
    y += 8
  }

  // Prepared by + signature
  y += 4
  doc.setDrawColor(220, 220, 220)
  doc.line(15, y, pageWidth - 15, y)
  y += 8

  doc.setFontSize(8.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  doc.text(`Prepared by: ${data.preparedBy}`, 15, y)
  doc.text("Approved by: ___________________", pageWidth - 15, y, { align: "right" })
  y += 8
  doc.text("Signature: _____________________", 15, y)

  return doc.output("blob")
}