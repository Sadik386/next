import jsPDF from "jspdf"

interface DeliverySlipData {
  orderId: string
  date: string
  business: {
    name: string
  }
  customer: {
    name: string
    phone?: string
    shippingAddress: string
  }
  items: Array<{
    name: string
    quantity: number
    unit: string
  }>
  notes?: string
}

export async function generateDeliverySlipPDF(data: DeliverySlipData): Promise<Blob> {
  const doc = new jsPDF({ format: "a5", orientation: "portrait" })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 15

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("DELIVERY SLIP", pageWidth / 2, y, { align: "center" })
  y += 8

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(data.business.name, 15, y)
  doc.text(data.date, pageWidth - 15, y, { align: "right" })
  y += 5

  doc.line(15, y, pageWidth - 15, y)
  y += 6

  doc.setFont("helvetica", "bold")
  doc.text(`ORDER ID: ${data.orderId}`, 15, y)
  y += 8

  doc.setFont("helvetica", "bold")
  doc.text("DELIVER TO:", 15, y)
  doc.setFont("helvetica", "normal")
  y += 5
  doc.text(data.customer.name, 15, y); y += 4
  if (data.customer.phone) { doc.text(`Phone: ${data.customer.phone}`, 15, y); y += 4 }
  doc.text(data.customer.shippingAddress, 15, y); y += 8

  doc.line(15, y, pageWidth - 15, y)
  y += 6

  doc.setFont("helvetica", "bold")
  doc.text("ITEMS:", 15, y)
  y += 5
  doc.setFont("helvetica", "normal")

  data.items.forEach(item => {
    doc.text(`□  ${item.name} × ${item.quantity} ${item.unit}`, 15, y)
    y += 6
  })

  y += 4
  doc.line(15, y, pageWidth - 15, y)
  y += 6

  if (data.notes) {
    doc.text(`Notes: ${data.notes}`, 15, y)
    y += 8
  }

  doc.text("Signature: ________________________", 15, y)

  return doc.output("blob")
}