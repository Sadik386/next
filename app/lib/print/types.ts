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
    taxId?: string;
    logo?: string;
  };
  order: {
    id: string;
    date: Date;
    items: PrintItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    paidAmount: number;
    notes?: string;
  };
  customer?: {
    name: string;
    phone: string;
    address: string;
  };
}
