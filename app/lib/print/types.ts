export type PrintFormat = 'receipt' | 'invoice' | 'delivery_label';

export interface PrintOptions {
  format: PrintFormat;
  copies?: number;
  silent?: boolean;
}

export interface PrintItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PrintData {
  business: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    taxId?: string;
    logo?: string;
    brandColor?: string;
    invoiceFooter?: string;
  };
  order: {
    id: string;
    orderId?: string;
    date: Date;
    items: PrintItem[];
    subtotal: number;
    tax: number;
    discount: number;
    shippingCharge?: number;
    total: number;
    paymentMethod: string;
    paymentStatus?: string;
    paidAmount: number;
    notes?: string;
  };
  currencySymbol?: string;
  customer?: {
    name: string;
    phone: string;
    address: string;
    email?: string;
  };
}
