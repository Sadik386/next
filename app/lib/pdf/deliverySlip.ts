import jsPDF from "jspdf"
import { autoTable } from "jspdf-autotable"
import { DeliverySlipData } from "./types"

export async function generateDeliverySlipPDF(data: DeliverySlipData): Promise<Blob> {
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
  doc.text("DELIVERY SLIP", pageWidth / 2, 9, { align: "center" })
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.text(data.business.name, pageWidth / 2, 16, { align: "center" })

  y = 28

  // === SLIP NUMBER + DATE BAR ===
  doc.setFillColor(248, 247, 245)
  doc.roundedRect(14, y - 4, pageWidth - 28, 12, 2, 2, "F")

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text(`SLIP #: ${data.slipNumber}`, 19, y + 3)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(`Date: ${data.date}`, pageWidth - 14, y + 3, { align: "right" })

  y += 14

  // === DELIVERY INFO BOX ===
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...brandColor)
  doc.setLineWidth(0.5)
  doc.roundedRect(14, y, pageWidth - 28, 42, 2, 2, "FD")

  // Left column
  doc.setTextColor(brandColor[0] - 40, brandColor[1] - 30, brandColor[2] - 20)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.text("DELIVER TO", 19, y + 7)

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(data.customer.name, 19, y + 15)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  let cx = y + 22
  if (data.customer.phone) { doc.text(`Tel: ${data.customer.phone}`, 19, cx); cx += 5 }
  doc.setTextColor(60, 60, 60)
  doc.text(data.customer.shippingAddress, 19, cx, { maxWidth: (pageWidth - 36) / 2 - 4 })

  // Right column
  const rx = pageWidth / 2 + 2
  doc.setTextColor(brandColor[0] - 40, brandColor[1] - 30, brandColor[2] - 20)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.text("ORDER INFO", rx, y + 7)

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text(`Order: ${data.orderId}`, rx, y + 15)

  if (data.courierName) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    doc.text(`Courier: ${data.courierName}`, rx, y + 22)
    if (data.trackingId) {
      doc.text(`Tracking: ${data.trackingId}`, rx, y + 28)
    }
  }

  if (data.codAmount) {
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2])
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`COD: ${data.currencySymbol}${Number(data.codAmount).toFixed(2)}`, rx, y + 36)
  }

  y += 48

  // === ITEMS TABLE ===
  autoTable(doc, {
    startY: y,
    head: [["#", "Product", "Qty", "Unit"]],
    body: data.items.map((item, i) => [
      (i + 1).toString(),
      item.name,
      item.quantity.toString(),
      item.unit,
    ]),
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: brandColor,
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 3.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: { fillColor: [252, 250, 247] },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "center", cellWidth: 20 },
    },
  } as any)

  y = (doc as any).lastAutoTable.finalY + 5

  // === NOTES ===
  if (data.notes) {
    doc.setFillColor(252, 250, 247)
    doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, "F")
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "italic")
    doc.text(`Delivery Instructions: ${data.notes}`, 19, y + 6.5, { maxWidth: pageWidth - 36 })
    y += 14
  }

  // === SIGNATURE SECTION ===
  doc.setDrawColor(brandColor[0] - 60, brandColor[1] - 50, brandColor[2] - 40)
  doc.line(14, y, pageWidth - 14, y)
  y += 6

  const sigCol = (label: string, x: number) => {
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.text(label, x, y)
    doc.line(x, y + 2, x + 38, y + 2)
    y += 6
  }

  sigCol("Received by", 14)
  sigCol("Date & Time", pageWidth / 2 - 20)

  // === FOOTER ===
  doc.setTextColor(180, 180, 180)
  doc.setFontSize(6.5)
  doc.text(`${data.business.name} — Packed with care`, pageWidth / 2, pageHeight - 5, { align: "center" })

  return doc.output("blob")
}