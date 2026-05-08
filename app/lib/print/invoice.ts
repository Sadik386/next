import { PrintData } from "./types";

// A5 invoice template (148mm x 210mm).
// TODO: Pull invoice footer text + payment terms from settings module.
export function generateInvoiceHtml(data: PrintData): string {
  const { business, order, customer } = data;

  const lineItems = order.items
    .map(
      (item, idx) => `
        <tr>
          <td style="padding:4px; border-bottom:1px solid #ddd;">${idx + 1}</td>
          <td style="padding:4px; border-bottom:1px solid #ddd;">${escape(item.name)}</td>
          <td style="padding:4px; border-bottom:1px solid #ddd; text-align:right;">${item.quantity}</td>
          <td style="padding:4px; border-bottom:1px solid #ddd; text-align:right;">${money(item.price)}</td>
          <td style="padding:4px; border-bottom:1px solid #ddd; text-align:right;">${money(item.total)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="width:148mm; padding:10mm; font-family: 'Helvetica', Arial, sans-serif; color:#222;">
      <header style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #222; padding-bottom:8px;">
        <div>
          ${business.logo ? `<img src="${business.logo}" style="max-height:50px;" />` : ""}
          <h2 style="margin:4px 0;">${escape(business.name)}</h2>
          <p style="margin:0; font-size:11px;">
            ${escape(business.address)}<br>
            Tel: ${escape(business.phone)}
            ${business.taxId ? `<br>Tax ID: ${escape(business.taxId)}` : ""}
          </p>
        </div>
        <div style="text-align:right;">
          <h1 style="margin:0; letter-spacing:2px;">INVOICE</h1>
          <p style="margin:0; font-size:11px;">
            Invoice #: <strong>${escape(order.id)}</strong><br>
            Date: ${order.date.toLocaleDateString()}<br>
            <!-- TODO: Compute/store due date in order payload -->
            Due: ${order.date.toLocaleDateString()}
          </p>
        </div>
      </header>

      <section style="display:flex; justify-content:space-between; margin-top:12px;">
        <div style="width:48%;">
          <strong>Bill To:</strong>
          <p style="margin:2px 0; font-size:11px;">
            ${customer ? `${escape(customer.name)}<br>${escape(customer.address)}<br>${escape(customer.phone)}` : "Walk-in Customer"}
          </p>
        </div>
        <div style="width:48%;">
          <strong>Ship To:</strong>
          <p style="margin:2px 0; font-size:11px;">
            ${customer ? `${escape(customer.name)}<br>${escape(customer.address)}` : "—"}
          </p>
        </div>
      </section>

      <table style="width:100%; border-collapse:collapse; margin-top:12px; font-size:11px;">
        <thead>
          <tr style="background:#f4f4f4;">
            <th style="padding:6px; text-align:left;">#</th>
            <th style="padding:6px; text-align:left;">Description</th>
            <th style="padding:6px; text-align:right;">Qty</th>
            <th style="padding:6px; text-align:right;">Unit</th>
            <th style="padding:6px; text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${lineItems}</tbody>
      </table>

      <section style="display:flex; justify-content:flex-end; margin-top:12px;">
        <table style="font-size:11px; min-width:180px;">
          <tr><td>Subtotal</td><td style="text-align:right;">${money(order.subtotal)}</td></tr>
          <tr><td>Discount</td><td style="text-align:right;">- ${money(order.discount)}</td></tr>
          <tr><td>Tax</td><td style="text-align:right;">${money(order.tax)}</td></tr>
          <tr style="font-weight:bold; border-top:1px solid #222;">
            <td>Total Due</td><td style="text-align:right;">${money(order.total)}</td>
          </tr>
          <tr><td>Paid (${escape(order.paymentMethod)})</td><td style="text-align:right;">${money(order.paidAmount)}</td></tr>
          <tr><td>Balance</td><td style="text-align:right;">${money(order.total - order.paidAmount)}</td></tr>
        </table>
      </section>

      <footer style="margin-top:16px; border-top:1px solid #ddd; padding-top:8px; font-size:10px; color:#666;">
        <!-- TODO: Replace with footer text/payment terms from settings.invoiceFooter -->
        <p style="margin:0;">Payment Terms: Net 30 days. Late payments subject to interest.</p>
        <p style="margin:0;">Thank you for your business.</p>
      </footer>
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
