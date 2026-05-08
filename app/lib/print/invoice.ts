import { PrintData } from "./types";

export function generateInvoiceHtml(data: PrintData): string {
  // TODO: Implement A5 invoice layout
  return `
    <div style="width: 148mm; padding: 10mm; font-family: sans-serif;">
      <h1>INVOICE</h1>
      <div style="display: flex; justify-content: space-between;">
        <div>
          <h3>${data.business.name}</h3>
          <p>${data.business.address}</p>
        </div>
        <div>
          <p>Invoice #: ${data.order.id}</p>
          <p>Date: ${data.order.date.toLocaleDateString()}</p>
        </div>
      </div>
      <hr>
      <!-- TODO: Add customer info, items table, and footer -->
    </div>
  `;
}
