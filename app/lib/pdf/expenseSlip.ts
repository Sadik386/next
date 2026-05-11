import jsPDF from "jspdf"
import { ExpenseSlipData } from "./types"

export async function generateExpenseSlipPDF(data: ExpenseSlipData): Promise<Blob> {
  const doc = new jsPDF({ format: "a5", orientation: "portrait" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const brandColor: [number, number, number] = [196, 151, 58]
  let y = 14

  // === HEADER ===
  doc.setFillColor(...brandColor)
  doc.rect(0, 0, pageWidth, 22, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("EXPENSE VOUCHER", pageWidth / 2, 9, { align: "center" })
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.text(data.business.name, pageWidth / 2, 16, { align: "center" })

  y = 28

  // === VOUCHER META BAR ===
  doc.setFillColor(248, 247, 245)
  doc.roundedRect(14, y - 4, pageWidth - 28, 12, 2, 2, "F")

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text(`Voucher #: ${data.expenseId}`, 19, y + 3)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(`Date: ${data.date}`, pageWidth - 14, y + 3, { align: "right" })

  y += 14

  // === DETAILS GRID ===
  const cols = [
    { label: "Vendor", value: data.vendor },
    { label: "Category", value: data.category },
    { label: "Payment Method", value: data.paymentMethod },
    { label: "Currency", value: `${data.currency} (${data.currencySymbol})` },
  ]

  if (data.receiptId) cols.push({ label: "Receipt ID", value: data.receiptId })
  if (data.referenceNo) cols.push({ label: "Reference #", value: data.referenceNo })

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(brandColor[0] - 60, brandColor[1] - 50, brandColor[2] - 40)
  doc.roundedRect(14, y, pageWidth - 28, Math.ceil(cols.length / 2) * 14 + 8, 2, 2, "FD")

  cols.forEach((col, i) => {
    const colX = i % 2 === 0 ? 19 : pageWidth / 2 + 2
    const rowY = y + 8 + Math.floor(i / 2) * 14

    doc.setTextColor(brandColor[0] - 40, brandColor[1] - 30, brandColor[2] - 20)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "bold")
    doc.text(col.label.toUpperCase(), colX, rowY)

    doc.setTextColor(30, 30, 30)
    doc.setFontSize(8.5)
    doc.setFont("helvetica", "bold")
    doc.text(col.value, colX, rowY + 5)
  })

  y += Math.ceil(cols.length / 2) * 14 + 14

  // === AMOUNT HIGHLIGHT ===
  doc.setFillColor(...brandColor)
  doc.roundedRect(14, y, pageWidth - 28, 20, 3, 3, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("TOTAL AMOUNT", 22, y + 8)

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(
    `${data.currencySymbol}${Number(data.amount).toFixed(2)}`,
    pageWidth - 22, y + 14, { align: "right" }
  )

  y += 26

  // === TAX BREAKDOWN ===
  if (data.taxAmount && Number(data.taxAmount) > 0) {
    doc.setFillColor(248, 247, 245)
    doc.roundedRect(14, y, pageWidth - 28, 12, 2, 2, "F")

    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("Tax Amount:", 19, y + 7.5)
    doc.setTextColor(30, 30, 30)
    doc.setFont("helvetica", "bold")
    doc.text(`${data.currencySymbol}${Number(data.taxAmount).toFixed(2)}`, pageWidth - 19, y + 7.5, { align: "right" })

    y += 16
  }

  // === DESCRIPTION ===
  if (data.description) {
    doc.setFillColor(252, 250, 247)
    doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, "F")

    doc.setTextColor(brandColor[0] - 40, brandColor[1] - 30, brandColor[2] - 20)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "bold")
    doc.text("DESCRIPTION", 19, y + 6)

    doc.setTextColor(60, 60, 60)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(data.description, 19, y + 11, { maxWidth: pageWidth - 36 })

    y += 18
  }

  // === NOTES ===
  if (data.notes) {
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "italic")
    doc.text(`Note: ${data.notes}`, 14, y, { maxWidth: pageWidth - 28 })
    y += 8
  }

  // === SIGNATURE SECTION ===
  doc.setDrawColor(brandColor[0] - 60, brandColor[1] - 50, brandColor[2] - 40)
  doc.line(14, y, pageWidth - 14, y)
  y += 8

  const sigRow = (label: string, value: string | undefined, x: number) => {
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.text(label, x, y)
    if (value) {
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(7.5)
      doc.setFont("helvetica", "bold")
      doc.text(value, x, y + 5)
    }
    doc.line(x, y + 7, x + 35, y + 7)
  }

  sigRow("Prepared by", data.preparedBy, 14)
  sigRow("Approved by", data.approvedBy, pageWidth / 2 - 18)
  sigRow("Signature", undefined, pageWidth - 52)

  // === FOOTER ===
  doc.setTextColor(180, 180, 180)
  doc.setFontSize(6.5)
  doc.text(`${data.business.name} — Expense Voucher`, pageWidth / 2, pageHeight - 5, { align: "center" })

  return doc.output("blob")
}