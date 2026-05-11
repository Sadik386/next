import jsPDF from "jspdf"
import "jspdf-autotable"
import { DeliverySlipData } from "./types"

export async function generateDeliverySlipPDF(data: DeliverySlipData): Promise<Blob> {
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
  doc.text("DELIVERY SLIP", pageWidth / 2, 14, { align: "center" })

  y = 30

  // Business + Order info
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text(data.business.name, 15, y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(data.date, pageWidth - 15, y, { align: "right" })
  y += 5

  if (data.business.phone) {
    doc.text(`Tel: ${data.business.phone}`, 15, y); y += 4
  }

  y += 2
  doc.setDrawColor(220, 220, 220)
  doc.line(15, y, pageWidth - 15, y)
  y += 6

  // Order ID + barcode placeholder
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(`ORDER: ${data.orderId}`, 15, y)
  y += 10

  // Deliver To box
  doc.setFillColor(248, 247, 245)
  doc.roundedRect(15, y, pageWidth - 30, 32, 2, 2, "F")

  doc.setTextColor(150, 150, 150)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.text("DELIVER TO", 19, y + 7)

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(data.customer.name, 19, y + 14)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  if (data.customer.phone) {
    doc.text(`Tel: ${data.customer.phone}`, 19, y + 20)
  }
  doc.text(data.customer.shippingAddress, 19, y + 26, { maxWidth: pageWidth - 40 })

  y += 38

  // Items
  doc.setTextColor(150, 150, 150)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.text("ITEMS", 15, y)
  y += 5

  data.items.forEach(item => {
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")

    // Checkbox
    doc.setDrawColor(150, 150, 150)
    doc.rect(15, y - 3.5, 4, 4)

    doc.text(`${item.name}`, 22, y)
    doc.setTextColor(100, 100, 100)
    doc.text(`× ${item.quantity} ${item.unit}`, pageWidth - 15, y, { align: "right" })
    y += 7
  })

  y += 4
  doc.setDrawColor(220, 220, 220)
  doc.line(15, y, pageWidth - 15, y)
  y += 6

  if (data.notes) {
    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(100, 100, 100)
    doc.text(`Note: ${data.notes}`, 15, y)
    y += 8
  }

  // Signature
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  doc.text("Received by: ___________________________", 15, y)
  y += 6
  doc.text("Signature: _____________________________", 15, y)
  y += 6
  doc.text("Date: _________________________________", 15, y)

  return doc.output("blob")
}