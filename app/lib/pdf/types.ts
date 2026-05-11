export interface BusinessInfo {
  name: string
  address?: string
  phone?: string
  email?: string
  taxId?: string
  logoUrl?: string
  invoiceFooter?: string
}

export interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate?: string
  business: BusinessInfo
  customer: {
    name: string
    email?: string
    phone?: string
    billingAddress?: string
    shippingAddress?: string
  }
  items: {
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
  subtotal: number
  tax?: number
  discount?: number
  total: number
  paymentMethod?: string
  paidAmount?: number
  balanceDue?: number
  notes?: string
  currencySymbol: string
}

export interface DeliverySlipData {
  slipNumber?: string
  orderId: string
  date: string
  business: BusinessInfo
  customer: {
    name: string
    phone?: string
    shippingAddress: string
  }
  courierName?: string
  trackingId?: string
  codAmount?: number
  currencySymbol?: string
  items: {
    name: string
    quantity: number
    unit: string
  }[]
  notes?: string
}

export interface ExpenseSlipData {
  expenseId: string
  date: string
  business: BusinessInfo
  vendor: string
  category: string
  amount: number
  currency: string
  currencySymbol: string
  paymentMethod: string
  receiptId?: string
  referenceNo?: string
  taxAmount?: number
  description?: string
  notes?: string
  preparedBy: string
  approvedBy?: string
}

export interface ReceiptData {
  receiptId: string
  date: string
  business: BusinessInfo
  customer?: { name: string }
  items: {
    name: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  subtotal: number
  tax?: number
  discount?: number
  total: number
  paymentMethod: string
  paidAmount?: number
  change?: number
  currencySymbol: string
}