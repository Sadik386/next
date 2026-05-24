import jsPDF from "jspdf"
import { ExpenseSlipData } from "./types"

type RGB = [number, number, number]

const INK: RGB = [0, 0, 0]
const TEXT: RGB = [20, 20, 20]
const MUTED: RGB = [100, 100, 100]
const BORDER: RGB = [220, 220, 220]
const LIGHT_BORDER: RGB = [240, 240, 240]

const PAGE_MARGIN = 20

export async function generateExpenseSlipPDF(data: ExpenseSlipData): Promise<Blob> {
  const doc = new jsPDF({ format: "a4", orientation: "portrait", unit: "mm" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const rightX = pageWidth - PAGE_MARGIN

  let y = 0

  y = PAGE_MARGIN

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(...INK)
  doc.text(safe(data.business.name, ""), PAGE_MARGIN, y + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  const busLines = businessContactLines(data)
  busLines.forEach((line, i) => {
    doc.text(line, PAGE_MARGIN, y + 10 + i * 4)
  })

  const titleY = y + 35
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(...INK)
  doc.text("EXPENSE VOUCHER", PAGE_MARGIN, titleY)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text("Voucher No:", PAGE_MARGIN, titleY + 9)
  doc.setTextColor(...TEXT)
  doc.text(safe(data.expenseId, "N/A"), PAGE_MARGIN + 20, titleY + 9)

  doc.setTextColor(...MUTED)
  doc.text("Date:", PAGE_MARGIN + 60, titleY + 9)
  doc.setTextColor(...TEXT)
  doc.text(safe(data.date, "N/A"), PAGE_MARGIN + 72, titleY + 9)

  y = titleY + 14
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.line(PAGE_MARGIN, y, rightX, y)
  y += 10

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text("VENDOR", PAGE_MARGIN, y)
  doc.text("CATEGORY", PAGE_MARGIN + 70, y)
  doc.text("PAYMENT METHOD", PAGE_MARGIN + 120, y)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(0.01)

  y += 4
  doc.setDrawColor(...LIGHT_BORDER)
  doc.setLineWidth(0.1)
  doc.line(PAGE_MARGIN, y, rightX, y)
  y += 6

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...TEXT)
  doc.text(safe(data.vendor, "—"), PAGE_MARGIN, y)
  doc.text(safe(data.category, "—"), PAGE_MARGIN + 70, y)
  doc.text(safe(data.paymentMethod, "—"), PAGE_MARGIN + 120, y)

  y += 8
  doc.setDrawColor(...LIGHT_BORDER)
  doc.setLineWidth(0.1)
  doc.line(PAGE_MARGIN, y, rightX, y)
  y += 8

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text("DESCRIPTION", PAGE_MARGIN, y)
  doc.text("NOTES", PAGE_MARGIN + 60, y)

  y += 4
  doc.setDrawColor(...LIGHT_BORDER)
  doc.setLineWidth(0.1)
  doc.line(PAGE_MARGIN, y, rightX, y)
  y += 6

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...TEXT)
  doc.text(safe(data.description, "—"), PAGE_MARGIN, y, { maxWidth: 50 })
  if (data.notes) {
    doc.text(data.notes, PAGE_MARGIN + 60, y, { maxWidth: rightX - PAGE_MARGIN - 60 })
  }

  y += 10
  doc.setDrawColor(...LIGHT_BORDER)
  doc.setLineWidth(0.1)
  doc.line(PAGE_MARGIN, y, rightX, y)
  y += 8

  if (data.receiptId || data.referenceNo || (data.taxAmount && Number(data.taxAmount) > 0)) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text("RECEIPT ID", PAGE_MARGIN, y)
    doc.text("REFERENCE #", PAGE_MARGIN + 55, y)
    if (data.taxAmount && Number(data.taxAmount) > 0) {
      const taxLabel = data.taxPercent
        ? `TAX (${data.taxPercent}%)`
        : "TAX"
      doc.text(taxLabel, PAGE_MARGIN + 100, y)
    }

    y += 4
    doc.setDrawColor(...LIGHT_BORDER)
    doc.setLineWidth(0.1)
    doc.line(PAGE_MARGIN, y, rightX, y)
    y += 6

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(...TEXT)
    doc.text(safe(data.receiptId, "—"), PAGE_MARGIN, y)
    doc.text(safe(data.referenceNo, "—"), PAGE_MARGIN + 55, y)
    if (data.taxAmount && Number(data.taxAmount) > 0) {
      doc.text(`${data.currency} ${Number(data.taxAmount).toFixed(2)}`, PAGE_MARGIN + 100, y)
    }

    y += 10
    doc.setDrawColor(...LIGHT_BORDER)
    doc.setLineWidth(0.1)
    doc.line(PAGE_MARGIN, y, rightX, y)
    y += 10
  }

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.5)
  doc.line(PAGE_MARGIN, y, rightX, y)
  y += 8

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text("AMOUNT", PAGE_MARGIN, y)

  const amountText = `${data.currency} ${Number(data.amount).toFixed(2)}`
  doc.setFontSize(18)
  doc.text(amountText, rightX, y, { align: "right" })

  y += 12
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.line(PAGE_MARGIN, y, rightX, y)

  y += 8
  const sigW = (rightX - PAGE_MARGIN) / 3
  const sig1 = PAGE_MARGIN
  const sig2 = PAGE_MARGIN + sigW
  const sig3 = PAGE_MARGIN + sigW * 2

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text("PREPARED BY", sig1, y)
  doc.text("APPROVED BY", sig2, y)
  doc.text("RECEIVED BY", sig3, y)

  y += 5
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...TEXT)
  doc.text(safe(data.preparedBy, ""), sig1, y)
  if (data.approvedBy) {
    doc.text(safe(data.approvedBy, ""), sig2, y)
  }

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.25)
  doc.line(sig1, y + 3, sig1 + 35, y + 3)
  doc.line(sig2, y + 3, sig2 + 35, y + 3)
  doc.line(sig3, y + 3, sig3 + 35, y + 3)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text(`${safe(data.business.name, "Business")} | Expense Voucher: ${safe(data.expenseId, "")}`, PAGE_MARGIN, pageHeight - 12)

  return doc.output("blob")
}

function businessContactLines(data: ExpenseSlipData) {
  return compact([
    data.business.address,
    data.business.phone,
    data.business.email,
  ])
}

function safe(value: string | undefined | null, fallback: string) {
  const text = String(value ?? "").trim()
  return text.length > 0 ? text : fallback
}

function compact(values: Array<string | undefined | null>) {
  return values.map((value) => String(value ?? "").trim()).filter(Boolean)
}