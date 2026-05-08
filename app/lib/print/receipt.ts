import { PrintData } from "./types";

export function generateReceiptHtml(data: PrintData): string {
  // TODO: Implement 80mm thermal receipt layout
  return `
    <div style="width: 80mm; font-family: monospace; font-size: 12px;">
      <h2 style="text-align: center;">${data.business.name}</h2>
      <p style="text-align: center;">${data.business.address}<br>Tel: ${data.business.phone}</p>
      <hr>
      <p>Order: ${data.order.id}<br>Date: ${data.order.date.toLocaleString()}</p>
      <hr>
      <table style="width: 100%;">
        ${data.order.items.map(item => `
          <tr>
            <td colspan="3">${item.name}</td>
          </tr>
          <tr>
            <td>${item.quantity} x ${item.price}</td>
            <td style="text-align: right;">${item.total}</td>
          </tr>
        `).join('')}
      </table>
      <hr>
      <div style="text-align: right;">
        <p>Total: ${data.order.total}</p>
        <p>Paid: ${data.order.paidAmount}</p>
      </div>
      <p style="text-align: center;">Thank You!</p>
    </div>
  `;
}
