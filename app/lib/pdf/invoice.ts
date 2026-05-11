import jsPDF from "jspdf"
import "jspdf-autotable"

interface InvoiceData {
  invoiceNumber: string
  date: string
  business: {
    name: string
    address?: string
    phone?: string
    email?: string
    taxId?: string
    invoiceFooter?: string
  }
  customer: {
    name: string
    email?: string
    phone?: string
    billingAddress?: string
  }
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod?: string
  paidAmount?: number
  balanceDue?: number
  notes?: string
  currencySymbol: string
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  const doc = new jsPDF({ format: "a5", orientation: "portrait" })

  const {
    invoiceNumber, date, business, customer,
    items, subtotal, tax, discount, total,
    paymentMethod, paidAmount, balanceDue,
    notes, currencySymbol
  } = data

  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 15

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(business.name, 15, y)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  y += 6
  if (business.address) { doc.text(business.address, 15, y); y += 4 }
  if (business.phone) { doc.text(`Phone: ${business.phone}`, 15, y); y += 4 }
  if (business.email) { doc.text(`Email: ${business.email}`, 15, y); y += 4 }
  if (business.taxId) { doc.text(`Tax ID: ${business.taxId}`, 15, y); y += 4 }

  y += 3
  doc.setDrawColor(200, 200, 200)
  doc.line(15, y, pageWidth - 15, y)
  y += 5

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("INVOICE", pageWidth - 15, y - 20, { align: "right" })

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - 15, y - 10, { align: "right" })
  doc.text(`Date: ${date}`, pageWidth - 15, y - 4, { align: "right" })

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("BILL TO:", 15, y)
  doc.setFont("helvetica", "normal")
  y += 5
  doc.text(customer.name, 15, y); y += 4
  if (customer.email) { doc.text(customer.email, 15, y); y += 4 }
  if (customer.phone) { doc.text(customer.phone, 15, y); y += 4 }
  if (customer.billingAddress) { doc.text(customer.billingAddress, 15, y); y += 4 }

  y += 5

  const tableData = items.map(item => [
    item.name,
    item.quantity.toString(),
    `${currencySymbol}${Number(item.unitPrice).toFixed(2)}`,
    `${currencySymbol}${Number(item.totalPrice).toFixed(2)}`
  ])

  ;(doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
    startY: y,
    head: [["Item", "Qty", "Unit Price", "Total"]],
    body: tableData,
    margin: { left: 15, right: 15 },
    headStyles: {
      fillColor: [196, 151, 58],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold"
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [252, 249, 245] },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  const totalsX = pageWidth - 15
  doc.setFontSize(9)
  doc.text("Subtotal:", totalsX - 40, y)
  doc.text(`${currencySymbol}${Number(subtotal).toFixed(2)}`, totalsX, y, { align: "right" })
  y += 5

  if (discount && Number(discount) > 0) {
    doc.text("Discount:", totalsX - 40, y)
    doc.text(`-${currencySymbol}${Number(discount).toFixed(2)}`, totalsX, y, { align: "right" })
    y += 5
  }

  if (tax && Number(tax) > 0) {
    doc.text("Tax:", totalsX - 40, y)
    doc.text(`${currencySymbol}${Number(tax).toFixed(2)}`, totalsX, y, { align: "right" })
    y += 5
  }

  doc.line(totalsX - 50, y, totalsX, y)
  y += 4

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("TOTAL:", totalsX - 40, y)
  doc.text(`${currencySymbol}${Number(total).toFixed(2)}`, totalsX, y, { align: "right" })
  y += 8

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  if (paymentMethod) {
    doc.text(`Payment Method: ${paymentMethod}`, 15, y); y += 4
  }
  if (paidAmount && Number(paidAmount) > 0) {
    doc.text(`Amount Paid: ${currencySymbol}${Number(paidAmount).toFixed(2)}`, 15, y); y += 4
  }
  if (balanceDue && Number(balanceDue) > 0) {
    doc.setTextColor(220, 38, 38)
    doc.text(`Balance Due: ${currencySymbol}${Number(balanceDue).toFixed(2)}`, 15, y)
    doc.setTextColor(0, 0, 0)
    y += 4
  }

  if (notes) {
    y += 4
    doc.setFont("helvetica", "italic")
    doc.text(`Notes: ${notes}`, 15, y)
    y += 4
  }

  if (business.invoiceFooter) {
    y += 5
    doc.setDrawColor(200, 200, 200)
    doc.line(15, y, pageWidth - 15, y)
    y += 4
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(150, 150, 150)
    doc.text(business.invoiceFooter, pageWidth / 2, y, { align: "center" })
  }

  return doc.output("blob")
}