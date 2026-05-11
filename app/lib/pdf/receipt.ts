import jsPDF from "jspdf"

interface ReceiptData {
  receiptId: string
  date: string
  business: {
    name: string
    address?: string
  }
  customer?: {
    name: string
  }
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: string
  paidAmount?: number
  change?: number
  currencySymbol: string
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Blob> {
  const doc = new jsPDF({
    format: [80, 200],
    orientation: "portrait",
    unit: "mm"
  })

  const pageWidth = 80
  let y = 10

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text(data.business.name, pageWidth / 2, y, { align: "center" })
  y += 6

  if (data.business.address) {
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.text(data.business.address, pageWidth / 2, y, { align: "center" })
    y += 4
  }

  doc.setDrawColor(0)
  doc.line(5, y, pageWidth - 5, y)
  y += 4

  doc.setFontSize(8)
  doc.text(`Receipt: ${data.receiptId}`, 5, y); y += 4
  doc.text(`Date: ${data.date}`, 5, y); y += 4
  if (data.customer) {
    doc.text(`Customer: ${data.customer.name}`, 5, y); y += 4
  }

  doc.line(5, y, pageWidth - 5, y)
  y += 4

  doc.setFontSize(7)
  data.items.forEach(item => {
    doc.text(item.name, 5, y)
    doc.text(
      `${item.quantity} x ${data.currencySymbol}${Number(item.unitPrice).toFixed(2)}`,
      5, y + 3
    )
    doc.text(
      `${data.currencySymbol}${Number(item.total).toFixed(2)}`,
      pageWidth - 5, y + 3, { align: "right" }
    )
    y += 8
  })

  doc.line(5, y, pageWidth - 5, y)
  y += 4

  doc.setFontSize(8)
  doc.text("Subtotal:", 5, y)
  doc.text(`${data.currencySymbol}${Number(data.subtotal).toFixed(2)}`, pageWidth - 5, y, { align: "right" })
  y += 4

  if (data.discount && Number(data.discount) > 0) {
    doc.text("Discount:", 5, y)
    doc.text(`-${data.currencySymbol}${Number(data.discount).toFixed(2)}`, pageWidth - 5, y, { align: "right" })
    y += 4
  }

  if (data.tax && Number(data.tax) > 0) {
    doc.text("Tax:", 5, y)
    doc.text(`${data.currencySymbol}${Number(data.tax).toFixed(2)}`, pageWidth - 5, y, { align: "right" })
    y += 4
  }

  doc.line(5, y, pageWidth - 5, y)
  y += 4

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("TOTAL:", 5, y)
  doc.text(`${data.currencySymbol}${Number(data.total).toFixed(2)}`, pageWidth - 5, y, { align: "right" })
  y += 6

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(`Payment: ${data.paymentMethod}`, 5, y); y += 4

  if (data.paidAmount) {
    doc.text(`Paid: ${data.currencySymbol}${Number(data.paidAmount).toFixed(2)}`, 5, y); y += 4
  }

  if (data.change && Number(data.change) > 0) {
    doc.text(`Change: ${data.currencySymbol}${Number(data.change).toFixed(2)}`, 5, y); y += 4
  }

  doc.line(5, y, pageWidth - 5, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Thank you!", pageWidth / 2, y, { align: "center" })
  y += 4
  doc.setFont("helvetica", "normal")
  doc.text("Come again.", pageWidth / 2, y, { align: "center" })

  return doc.output("blob")
}