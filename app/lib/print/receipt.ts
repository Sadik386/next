import { PrintData } from "./types";

// 80mm thermal receipt template (POS).
// TODO: Wire real barcode rendering (e.g. JsBarcode) where the placeholder is.
export function generateReceiptHtml(data: PrintData): string {
  const { business, order, customer } = data;

  const itemsRows = order.items
    .map(
      (item) => `
        <tr>
          <td colspan="3" style="padding-top:4px;">${escape(item.name)}</td>
        </tr>
        <tr>
          <td>${item.quantity} x ${money(item.price)}</td>
          <td></td>
          <td style="text-align:right;">${money(item.total)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="width:80mm; font-family: 'Courier New', monospace; font-size:12px; color:#000;">
      ${business.logo ? `<div style="text-align:center;"><img src="${business.logo}" style="max-height:40px;" /></div>` : ""}
      <h2 style="text-align:center; margin:4px 0;">${escape(business.name)}</h2>
      <p style="text-align:center; margin:0;">
        ${escape(business.address)}<br>
        Tel: ${escape(business.phone)}
        ${business.taxId ? `<br>Tax ID: ${escape(business.taxId)}` : ""}
      </p>
      <hr>
      <p style="margin:0;">
        Receipt #: ${escape(order.id)}<br>
        Date: ${order.date.toLocaleString()}
        ${customer ? `<br>Customer: ${escape(customer.name)}` : ""}
      </p>
      <hr>
      <table style="width:100%; border-collapse:collapse;">
        ${itemsRows}
      </table>
      <hr>
      <table style="width:100%;">
        <tr><td>Subtotal</td><td style="text-align:right;">${money(order.subtotal)}</td></tr>
        <tr><td>Discount</td><td style="text-align:right;">- ${money(order.discount)}</td></tr>
        <tr><td>Tax</td><td style="text-align:right;">${money(order.tax)}</td></tr>
        <tr style="font-weight:bold;"><td>TOTAL</td><td style="text-align:right;">${money(order.total)}</td></tr>
      </table>
      <hr>
      <p style="margin:0;">
        Payment: ${escape(order.paymentMethod)}<br>
        Paid: ${money(order.paidAmount)}<br>
        Change: ${money(Math.max(0, order.paidAmount - order.total))}
      </p>
      <hr>
      <!-- TODO: Render barcode of order ID using JsBarcode/QRCode lib -->
      <div data-barcode="${escape(order.id)}" style="text-align:center; padding:6px 0;">
        *${escape(order.id)}*
      </div>
      <p style="text-align:center; margin:4px 0;">Thank you for your purchase!</p>
      ${order.notes ? `<p style="text-align:center; font-style:italic;">${escape(order.notes)}</p>` : ""}
    </div>
  `;
}

function money(n: number): string {
  return n.toFixed(2);
}

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c),
  );
}
