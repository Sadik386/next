import { PrintData } from "./types";

// Delivery / shipping label template (~100mm x 150mm, ~4x6").
// TODO: Wire real barcode/QR rendering (JsBarcode + QRCode) where placeholders are.
export function generateDeliveryLabelHtml(data: PrintData): string {
  const { business, order, customer } = data;

  return `
    <div style="width:100mm; height:150mm; border:2px solid #000; padding:5mm; font-family: Arial, sans-serif; box-sizing:border-box;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #000; padding-bottom:4px;">
        <strong>DELIVERY LABEL</strong>
        <span style="font-size:10px;">#${escape(order.id)}</span>
      </div>

      <div style="margin-top:6px;">
        <strong style="font-size:11px;">FROM:</strong>
        <p style="margin:2px 0; font-size:11px;">
          ${escape(business.name)}<br>
          ${escape(business.address)}<br>
          Tel: ${escape(business.phone)}
        </p>
      </div>

      <div style="margin-top:8px; padding:6px; border:1px dashed #000;">
        <strong style="font-size:13px;">TO:</strong>
        <p style="margin:2px 0; font-size:13px; line-height:1.4;">
          <strong>${escape(customer?.name ?? "Recipient")}</strong><br>
          ${escape(customer?.address ?? "—")}<br>
          Tel: ${escape(customer?.phone ?? "—")}
        </p>
      </div>

      <div style="margin-top:10px; text-align:center;">
        <!-- TODO: Render Code128 barcode of order.id -->
        <div data-barcode="${escape(order.id)}" style="font-family:'Libre Barcode 128', monospace; font-size:24px;">
          *${escape(order.id)}*
        </div>
        <div style="font-size:10px;">Order: ${escape(order.id)}</div>
      </div>

      <div style="position:relative; margin-top:8px; display:flex; justify-content:space-between; font-size:10px;">
        <span>Items: ${order.items.length}</span>
        <span>Date: ${order.date.toLocaleDateString()}</span>
        <!-- TODO: Render QR code containing tracking URL -->
        <span data-qr="${escape(order.id)}" style="border:1px solid #000; padding:2px;">[QR]</span>
      </div>
    </div>
  `;
}

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c),
  );
}
