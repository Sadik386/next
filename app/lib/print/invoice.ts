import { PrintData } from "./types";

type TotalRow = { label: string; value: string };

// A5 invoice template (148mm x 210mm).
export function generateInvoiceHtml(data: PrintData): string {
  const { business, order, customer } = data;
  const brand = safeHex(business.brandColor);
  const currency = data.currencySymbol ?? "";
  const balanceDue = Math.max(0, Number(order.total) - Number(order.paidAmount ?? 0));
  const hasItemDiscount = order.items.some((item) => itemDiscount(item) > 0);
  const invoiceNumber = fallback(order.id, "N/A");
  const orderReference = fallback(order.orderId, order.id);
  const paymentMethod = fallback(order.paymentMethod, "Not specified");
  const paymentStatus = titleCase(order.paymentStatus ?? (balanceDue > 0 ? "partial" : "paid"));
  const noteText = fallback(business.invoiceFooter, "Thank you for your business.");
  const customerName = fallback(customer?.name, "Walk-in Customer");
  const customerLines = compact([customer?.phone, customer?.email, customer?.address]);
  const businessLines = compact([
    fallback(business.address, "Business address not set"),
    compact([business.phone, business.email]).join(" | "),
    business.taxId ? `Tax ID: ${business.taxId}` : "",
  ]);
  const summaryRows = buildSummaryRows(order, currency, balanceDue);
  const highlightLabel = balanceDue > 0 ? "Total Due" : "Grand Total";
  const highlightValue = money(currency, balanceDue > 0 ? balanceDue : order.total);
  const lineItems = order.items.length
    ? order.items
        .map(
          (item) => `
            <tr>
              <td class="item-name">${escape(item.name)}</td>
              <td class="center">${item.quantity}</td>
              <td class="right">${money(currency, item.price)}</td>
              <td class="right">${hasItemDiscount && itemDiscount(item) > 0 ? money(currency, itemDiscount(item)) : ""}</td>
              <td class="right amount">${money(currency, item.total)}</td>
            </tr>
          `,
        )
        .join("")
    : `
        <tr>
          <td colspan="5" class="empty-state">No items available for this invoice.</td>
        </tr>
      `;

  return `
    <style>
      @page { size: A5; margin: 0; }
      * { box-sizing: border-box; }
      :root { color-scheme: light; }
      html, body { margin: 0; background: #ffffff; color: #1f2937; }
      body {
        font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        font-size: 10px;
        line-height: 1.45;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .invoice-sheet {
        width: 148mm;
        min-height: 210mm;
        background: #ffffff;
      }
      .invoice-shell {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      .invoice-shell > thead { display: table-header-group; }
      .invoice-shell > tbody { display: table-row-group; }
      .invoice-shell > tfoot { display: table-footer-group; }
      .invoice-shell > thead > tr > td,
      .invoice-shell > tbody > tr > td,
      .invoice-shell > tfoot > tr > td {
        padding: 0;
        vertical-align: top;
      }
      .page-header {
        padding: 12mm 12mm 5mm;
        border-top: 2.2mm solid ${brand};
      }
      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8mm;
        margin-bottom: 5mm;
      }
      .brand-block {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 4mm;
      }
      .logo-frame {
        width: 28mm;
        height: 14mm;
        border-radius: 4mm;
        border: 1px solid ${tint(brand, 0.8)};
        background: ${tint(brand, 0.96)};
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        flex: none;
      }
      .logo {
        max-width: 22mm;
        max-height: 10mm;
        object-fit: contain;
        display: block;
      }
      .brand-mark {
        width: 18mm;
        height: 10mm;
        position: relative;
        color: ${brand};
      }
      .brand-mark span {
        position: absolute;
        left: 0;
        width: 9mm;
        height: 1.5mm;
        background: currentColor;
        border-radius: 999px;
        transform: rotate(-28deg);
        transform-origin: left center;
      }
      .brand-mark span:nth-child(1) { top: 3.8mm; }
      .brand-mark span:nth-child(2) { top: 6.2mm; left: 4mm; }
      .brand-mark span:nth-child(3) { top: 8.6mm; left: 8mm; }
      .brand-initials {
        position: absolute;
        right: 0;
        top: 1.2mm;
        font-size: 5.8px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0.16em;
      }
      .brand-copy { min-width: 0; }
      .brand-name {
        margin: 0;
        font-size: 12px;
        line-height: 1.05;
        font-weight: 800;
        letter-spacing: -0.03em;
        overflow-wrap: anywhere;
      }
      .brand-meta {
        margin: 1.4mm 0 0;
        color: #667085;
        font-size: 7.7px;
        line-height: 1.55;
        overflow-wrap: anywhere;
      }
      .title-block {
        flex: none;
        max-width: 42mm;
        text-align: right;
      }
      .eyebrow {
        margin: 0 0 1.8mm;
        color: ${brand};
        font-size: 6.8px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0.24em;
        text-transform: uppercase;
      }
      .invoice-title {
        margin: 0;
        color: #111827;
        font-size: 23px;
        line-height: 0.95;
        font-weight: 900;
        letter-spacing: 0.16em;
      }
      .status-pill {
        display: inline-flex;
        margin-top: 2.6mm;
        padding: 1.2mm 2.7mm;
        border-radius: 999px;
        border: 1px solid ${tint(brand, 0.72)};
        background: ${tint(brand, 0.95)};
        color: ${brand};
        font-size: 6.6px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 3mm;
        margin-bottom: 4mm;
      }
      .meta-card,
      .party-card,
      .summary-card,
      .totals-card {
        border: 1px solid #e7ebf0;
        border-radius: 4.4mm;
        background: #ffffff;
      }
      .meta-card {
        min-height: 13.5mm;
        padding: 3mm 3.2mm;
      }
      .meta-card.accent {
        border-color: ${tint(brand, 0.72)};
        background: ${tint(brand, 0.96)};
      }
      .section-label {
        margin: 0 0 1.6mm;
        color: #667085;
        font-size: 6.6px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }
      .section-value {
        margin: 0;
        color: #111827;
        font-size: 10.1px;
        line-height: 1.25;
        font-weight: 800;
        overflow-wrap: anywhere;
      }
      .section-help {
        margin: 1.2mm 0 0;
        color: #667085;
        font-size: 7.2px;
        line-height: 1.45;
        overflow-wrap: anywhere;
      }
      .party-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 3mm;
      }
      .party-card {
        min-height: 24mm;
        padding: 3.6mm;
      }
      .party-card .section-label { color: ${brand}; }
      .party-name {
        margin: 0 0 1.4mm;
        color: #111827;
        font-size: 10.4px;
        line-height: 1.2;
        font-weight: 800;
        overflow-wrap: anywhere;
      }
      .party-copy {
        margin: 0;
        color: #667085;
        font-size: 7.7px;
        line-height: 1.6;
        white-space: pre-line;
        overflow-wrap: anywhere;
      }
      .content-cell { padding: 0 12mm !important; }
      .items-wrap {
        overflow: hidden;
        border: 1px solid #e7ebf0;
        border-radius: 4.8mm;
        background: #ffffff;
      }
      .items {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        page-break-inside: auto;
      }
      .items thead { display: table-header-group; }
      .items th {
        padding: 2.8mm 2mm;
        background: ${tint(brand, 0.96)};
        color: #475467;
        font-size: 6.7px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        text-align: left;
        border-bottom: 1px solid ${tint(brand, 0.8)};
      }
      .items td {
        padding: 2.8mm 2mm;
        color: #475467;
        font-size: 8.5px;
        line-height: 1.5;
        border-bottom: 1px solid #eef2f6;
        vertical-align: middle;
        overflow-wrap: anywhere;
      }
      .items tr { break-inside: avoid; page-break-inside: avoid; }
      .items tbody tr:last-child td { border-bottom: none; }
      .item-name {
        color: #111827;
        font-weight: 700;
      }
      .center { text-align: center; }
      .right { text-align: right; }
      .amount {
        color: ${brand};
        font-weight: 800;
      }
      .empty-state {
        text-align: center;
        color: #667085;
        padding: 10mm 4mm !important;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 46mm;
        gap: 4mm;
        margin-top: 5mm;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .summary-card {
        min-height: 40mm;
        padding: 4mm;
      }
      .note-chip {
        display: inline-flex;
        padding: 1.1mm 2.4mm;
        border-radius: 999px;
        background: ${tint(brand, 0.95)};
        color: ${brand};
        font-size: 6.4px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .summary-title {
        margin: 3mm 0 1.6mm;
        color: #111827;
        font-size: 12px;
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
      .summary-copy {
        margin: 0;
        color: #667085;
        font-size: 7.8px;
        line-height: 1.7;
        overflow-wrap: anywhere;
      }
      .summary-copy + .summary-copy { margin-top: 2mm; }
      .summary-copy strong {
        color: #111827;
        font-weight: 700;
      }
      .totals-card {
        padding: 4mm;
        border-color: ${tint(brand, 0.72)};
        background: ${tint(brand, 0.96)};
      }
      .totals-heading {
        margin: 0 0 2.4mm;
        color: ${brand};
        font-size: 6.5px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }
      .total-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 3mm;
        padding: 1.3mm 0;
        color: #475467;
        font-size: 8.2px;
        line-height: 1.45;
        border-bottom: 1px solid #e4e9ef;
      }
      .total-row:last-of-type { border-bottom: none; }
      .total-row strong {
        color: #111827;
        font-weight: 700;
      }
      .total-row.highlight {
        margin-top: 2.2mm;
        padding-top: 2.8mm;
        border-top: 1px solid ${tint(brand, 0.72)};
        border-bottom: none;
        align-items: flex-end;
      }
      .total-row.highlight span:first-child {
        color: ${brand};
        font-size: 6.5px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }
      .total-row.highlight strong {
        color: ${brand};
        font-size: 17px;
        line-height: 1;
        font-weight: 900;
      }
      .total-caption {
        margin: 2mm 0 0;
        color: #667085;
        font-size: 7px;
        line-height: 1.45;
        text-align: right;
      }
      .page-footer { padding: 3mm 12mm 5mm; }
      .footer-wrap {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 4mm;
        align-items: end;
        padding-top: 3mm;
        border-top: 1px solid #e7ebf0;
      }
      .footer-copy {
        color: #667085;
        font-size: 7px;
        line-height: 1.55;
        overflow-wrap: anywhere;
      }
      .footer-copy strong {
        display: block;
        margin-bottom: 0.8mm;
        color: #111827;
        font-size: 7.1px;
        line-height: 1.2;
      }
      .footer-page {
        color: #667085;
        font-size: 6.8px;
        line-height: 1;
        text-align: right;
        white-space: nowrap;
      }
      .footer-page::after { content: "Page " counter(page) " of " counter(pages); }
      @media print {
        html, body {
          width: 148mm;
          min-height: 210mm;
          background: #ffffff;
        }
        .invoice-sheet {
          width: 148mm;
          min-height: 210mm;
        }
        .invoice-shell > thead { display: table-header-group; }
        .invoice-shell > tfoot { display: table-footer-group; }
        .items thead { display: table-header-group; }
        .summary-grid,
        .items tr { break-inside: avoid; page-break-inside: avoid; }
      }
    </style>

    <main class="invoice-sheet">
      <table class="invoice-shell">
        <thead>
          <tr>
            <td>
              <header class="page-header">
                <div class="header-top">
                  <div class="brand-block">
                    <div class="logo-frame">
                      ${
                        business.logo
                          ? `<img class="logo" src="${escapeAttr(business.logo)}" alt="">`
                          : `<div class="brand-mark"><span></span><span></span><span></span><span class="brand-initials">${escape(initials(business.name))}</span></div>`
                      }
                    </div>
                    <div class="brand-copy">
                      <p class="brand-name">${escape(fallback(business.name, "My Business"))}</p>
                      <p class="brand-meta">${escape(businessLines.join("\n"))}</p>
                    </div>
                  </div>
                  <div class="title-block">
                    <p class="eyebrow">Sales Invoice</p>
                    <h1 class="invoice-title">INVOICE</h1>
                    <span class="status-pill">${escape(paymentStatus)}</span>
                  </div>
                </div>

                <section class="meta-grid">
                  <div class="meta-card">
                    <p class="section-label">Invoice No</p>
                    <p class="section-value">${escape(invoiceNumber)}</p>
                    <p class="section-help">Reference</p>
                  </div>
                  <div class="meta-card">
                    <p class="section-label">Order ID</p>
                    <p class="section-value">${escape(orderReference)}</p>
                    <p class="section-help">Order reference</p>
                  </div>
                  <div class="meta-card">
                    <p class="section-label">Date</p>
                    <p class="section-value">${escape(formatDate(order.date))}</p>
                    <p class="section-help">Issue date</p>
                  </div>
                  <div class="meta-card accent">
                    <p class="section-label">Payment</p>
                    <p class="section-value">${escape(paymentMethod)}</p>
                    <p class="section-help">${escape(paymentStatus)}</p>
                  </div>
                </section>

                <section class="party-grid">
                  <div class="party-card">
                    <p class="section-label">Bill To</p>
                    <p class="party-name">${escape(customerName)}</p>
                    <p class="party-copy">${escape(customerLines.join("\n") || "Customer details not available")}</p>
                  </div>
                  <div class="party-card">
                    <p class="section-label">From</p>
                    <p class="party-name">${escape(fallback(business.name, "My Business"))}</p>
                    <p class="party-copy">${escape(businessLines.join("\n"))}</p>
                  </div>
                </section>
              </header>
            </td>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td class="content-cell">
              <section class="items-wrap">
                <table class="items">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th class="center" style="width: 13mm;">Qty</th>
                      <th class="right" style="width: 20mm;">Unit</th>
                      <th class="right" style="width: ${hasItemDiscount ? "16mm" : "1mm"};">${hasItemDiscount ? "Discount" : ""}</th>
                      <th class="right" style="width: 24mm;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>${lineItems}</tbody>
                </table>
              </section>

              <section class="summary-grid">
                <div class="summary-card">
                  <span class="note-chip">${escape(paymentStatus)}</span>
                  <h2 class="summary-title">Thank you for your order.</h2>
                  <p class="summary-copy">${escape(noteText)}</p>
                  ${
                    order.notes
                      ? `<p class="summary-copy"><strong>Order note:</strong> ${escape(order.notes)}</p>`
                      : ""
                  }
                </div>

                <div class="totals-card">
                  <p class="totals-heading">Summary</p>
                  ${summaryRows
                    .map(
                      (row) => `
                        <div class="total-row">
                          <span>${escape(row.label)}</span>
                          <strong>${escape(row.value)}</strong>
                        </div>
                      `,
                    )
                    .join("")}
                  <div class="total-row highlight">
                    <span>${escape(highlightLabel)}</span>
                    <strong>${escape(highlightValue)}</strong>
                  </div>
                  <p class="total-caption">${escape(balanceDue > 0 ? "Outstanding amount payable." : "Final invoice total.")}</p>
                </div>
              </section>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td>
              <footer class="page-footer">
                <div class="footer-wrap">
                  <div class="footer-copy">
                    <strong>${escape(fallback(business.name, "My Business"))}</strong>
                    ${escape(compact([business.address, business.phone, business.email]).join(" | ") || "Contact details not set")}
                  </div>
                  <div class="footer-page"></div>
                </div>
              </footer>
            </td>
          </tr>
        </tfoot>
      </table>
    </main>
  `;
}

function buildSummaryRows(order: PrintData["order"], currency: string, balanceDue: number): TotalRow[] {
  const rows: TotalRow[] = [{ label: "Subtotal", value: money(currency, order.subtotal) }];
  if (Number(order.discount ?? 0) > 0) rows.push({ label: "Discount", value: `-${money(currency, order.discount ?? 0)}` });
  if (Number(order.tax ?? 0) > 0) rows.push({ label: "Tax", value: money(currency, order.tax ?? 0) });
  if (Number(order.shippingCharge ?? 0) > 0) rows.push({ label: "Delivery", value: money(currency, order.shippingCharge ?? 0) });
  if (balanceDue > 0) rows.push({ label: "Grand Total", value: money(currency, order.total) });
  if (Number(order.paidAmount ?? 0) > 0) rows.push({ label: "Paid", value: `-${money(currency, order.paidAmount ?? 0)}` });
  return rows;
}

function formatDate(value: Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function money(prefix: string, n: number): string {
  return `${prefix}${Number(n || 0).toFixed(2)}`;
}

function itemDiscount(item: { quantity: number; price: number; total: number }) {
  return Math.max(0, item.quantity * Number(item.price) - Number(item.total));
}

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c),
  );
}

function escapeAttr(s: string): string {
  return escape(s).replace(/`/g, "&#96;");
}

function fallback(value: string | undefined | null, safeValue: string) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : safeValue;
}

function compact(values: Array<string | undefined | null>) {
  return values.map((value) => String(value ?? "").trim()).filter(Boolean);
}

function safeHex(value?: string) {
  const raw = String(value ?? "").trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw) ? raw : "#FF6854";
}

function hexToRgb(value: string): [number, number, number] {
  const raw = value.replace("#", "");
  const hex = raw.length === 3 ? raw.split("").map((char) => char + char).join("") : raw;
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

function tint(value: string, amount: number) {
  const [r, g, b] = hexToRgb(safeHex(value));
  return `rgb(${Math.round(r + (255 - r) * amount)}, ${Math.round(g + (255 - g) * amount)}, ${Math.round(b + (255 - b) * amount)})`;
}

function titleCase(value: string) {
  const clean = String(value || "").replace(/[_-]+/g, " ").trim();
  if (!clean) return "N/A";
  return clean.replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
}

function initials(name: string) {
  return (compact(String(name || "My Business").split(/\s+/))[0]?.[0] ?? "M").toUpperCase();
}
