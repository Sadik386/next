import { PrintData, PrintOptions } from "./types";
import { generateReceiptHtml } from "./receipt";
import { generateInvoiceHtml } from "./invoice";
import { generateDeliveryLabelHtml } from "./delivery";

export class PrintManager {
  static async print(data: PrintData, options: PrintOptions) {
    let html = '';
    
    switch (options.format) {
      case 'receipt':
        html = generateReceiptHtml(data);
        break;
      case 'invoice':
        html = generateInvoiceHtml(data);
        break;
      case 'delivery_label':
        html = generateDeliveryLabelHtml(data);
        break;
    }

    // Check if running in Electron/Tauri
    if ((window as any).electronAPI) {
      return (window as any).electronAPI.print({ html, ...options });
    }

    // Fallback to browser printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><body>${html}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }
}
