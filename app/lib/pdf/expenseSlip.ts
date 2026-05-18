import jsPDF from "jspdf"
import { ExpenseSlipData } from "./types"

export async function generateExpenseSlipPDF(data: ExpenseSlipData): Promise<Blob> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [203.2, 101.6] })
  const W = doc.internal.pageSize.getWidth()  // ~203
  const H = doc.internal.pageSize.getHeight() // ~101.6
  const brand: [number, number, number] = [196, 151, 58]
  const dark: [number, number, number] = [30, 30, 30]
  const gray: [number, number, number] = [120, 120, 120]
  const light: [number, number, number] = [245, 245, 245]

  // LEFT STRIP - "EXPENSE VOUCHER" vertical
  doc.setFillColor(...brand)
  doc.rect(0, 0, 18, H, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("EXPENSE VOUCHER", 9, H - 8, { angle: 90, align: "left" })

  // MAIN CONTENT AREA starts at x=22
  const x = 22
  const rightEdge = W - 10
  const mid = x + (rightEdge - x) / 2

  // TITLE - Business Name
  doc.setTextColor(...dark)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text(data.business.name.toUpperCase(), x, 10)

  // Subtitle - phone | email
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...gray)
  const subtitle = [data.business.phone, data.business.email].filter(Boolean).join("  |  ")
  if (subtitle) doc.text(subtitle, x, 16)

  // Voucher # and Date on same line
  doc.setFontSize(8)
  doc.setTextColor(...gray)
  doc.text(`Voucher #: ${data.expenseId}`, rightEdge - 80, 10)
  doc.text(`Date: ${data.date}`, rightEdge, 10, { align: "right" })

  // Divider
  doc.setDrawColor(...brand)
  doc.setLineWidth(0.5)
  doc.line(x, 19, rightEdge, 19)

  // ROW 1: Vendor + Amount
  let y = 25
  doc.setTextColor(...gray)
  doc.setFontSize(6)
  doc.setFont("helvetica", "normal")
  doc.text("VENDOR", x, y - 2)
  doc.text("AMOUNT", rightEdge - 40, y - 2)

  doc.setTextColor(...dark)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text(data.vendor || "", x, y + 3)
  doc.text(`${data.currency} ${Number(data.amount).toFixed(2)}`, rightEdge, y + 3, { align: "right" })
  doc.setLineWidth(0.25)
  doc.setDrawColor(200, 200, 200)
  doc.line(x, y + 6, mid - 5, y + 6)
  doc.line(mid + 30, y + 6, rightEdge, y + 6)

  // ROW 2: Vendor Receipt ID + Category
  y += 13
  doc.setTextColor(...gray)
  doc.setFontSize(6)
  doc.setFont("helvetica", "normal")
  doc.text("VENDOR RECEIPT ID", x, y - 2)
  doc.text("CATEGORY", mid, y - 2)

  doc.setTextColor(...dark)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text(data.receiptId || "", x, y + 3)
  doc.text(data.category || "", mid, y + 3)
  doc.setDrawColor(200, 200, 200)
  doc.line(x, y + 6, mid - 5, y + 6)
  doc.line(mid, y + 6, rightEdge, y + 6)

  // ROW 3: Payment Method + Reference #
  y += 13
  doc.setTextColor(...gray)
  doc.setFontSize(6)
  doc.setFont("helvetica", "normal")
  doc.text("PAYMENT METHOD", x, y - 2)
  doc.text("REFERENCE #", mid, y - 2)

  doc.setTextColor(...dark)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text(data.paymentMethod || "", x, y + 3)
  doc.text(data.referenceNo || "", mid, y + 3)
  doc.setDrawColor(200, 200, 200)
  doc.line(x, y + 6, mid - 5, y + 6)
  doc.line(mid, y + 6, rightEdge, y + 6)

  // ROW 4: Description (full width)
  y += 13
  doc.setTextColor(...gray)
  doc.setFontSize(6)
  doc.setFont("helvetica", "normal")
  doc.text("DESCRIPTION", x, y - 2)
  doc.setTextColor(...dark)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text(data.description || "", x, y + 3)
  doc.setDrawColor(200, 200, 200)
  doc.line(x, y + 6, rightEdge, y + 6)

  // ROW 5: Notes + Tax Amount (if has value)
  y += 13
  doc.setTextColor(...gray)
  doc.setFontSize(6)
  doc.setFont("helvetica", "normal")
  doc.text("NOTES / MEMO", x, y - 2)

  doc.setTextColor(...dark)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  if (data.notes) {
    doc.text(data.notes, x, y + 3)
  }
  doc.setDrawColor(200, 200, 200)
  doc.line(x, y + 6, mid - 5, y + 6)

  // Tax on the right side of row 5
  if (data.taxAmount && Number(data.taxAmount) > 0) {
    doc.setTextColor(...gray)
    doc.setFontSize(6)
    doc.setFont("helvetica", "normal")
    doc.text("TAX AMOUNT", mid, y - 2)
    doc.setTextColor(...dark)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    const taxText = data.taxPercent
      ? `${data.currency} ${Number(data.taxAmount).toFixed(2)} (${data.taxPercent}%)`
      : `${data.currency} ${Number(data.taxAmount).toFixed(2)}`
    doc.text(taxText, mid, y + 3)
  }
  doc.line(mid, y + 6, rightEdge, y + 6)

  // BOTTOM DIVIDER
  y += 11
  doc.setDrawColor(...brand)
  doc.setLineWidth(0.5)
  doc.line(x, y, rightEdge, y)

  // SIGNATURE ROW
  y += 5
  const sigW = (rightEdge - x) / 3
  const sig1 = x
  const sig2 = x + sigW
  const sig3 = x + sigW * 2

  doc.setTextColor(...gray)
  doc.setFontSize(6)
  doc.setFont("helvetica", "normal")
  doc.text("PREPARED BY", sig1, y)
  doc.text("APPROVED BY", sig2, y)
  doc.text("RECEIVED BY / SIGNATURE", sig3, y)

  doc.setTextColor(...dark)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  if (data.preparedBy) doc.text(data.preparedBy, sig1, y + 4)
  if (data.approvedBy) doc.text(data.approvedBy, sig2, y + 4)

  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.25)
  doc.line(sig1, y + 7, sig1 + 40, y + 7)
  doc.line(sig2, y + 7, sig2 + 40, y + 7)
  doc.line(sig3, y + 7, sig3 + 40, y + 7)

  // FOOTER
  doc.setTextColor(180, 180, 180)
  doc.setFontSize(5.5)
  doc.text(`${data.business.name} - Expense Voucher`, W / 2, H - 3, { align: "center" })

  return doc.output("blob")
}