import { PrintData } from "./types";

export function generateDeliveryLabelHtml(data: PrintData): string {
  // TODO: Implement delivery label layout (4x6 inch or similar)
  return `
    <div style="width: 100mm; height: 150mm; border: 2px solid black; padding: 5mm;">
      <h2>DELIVERY LABEL</h2>
      <hr>
      <div style="margin-bottom: 20px;">
        <strong>TO:</strong>
        <p>${data.customer?.name}<br>${data.customer?.address}<br>Phone: ${data.customer?.phone}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <strong>FROM:</strong>
        <p>${data.business.name}<br>${data.business.phone}</p>
      </div>
      <!-- TODO: Add Barcode/QR Code -->
    </div>
  `;
}
