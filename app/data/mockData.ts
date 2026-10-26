export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string;
  warehouse: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export interface CartItem extends Product {
  quantity: number;
  discount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  itemsCount: number;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: "Cash" | "Credit Card" | "Mobile Pay" | "Store Credit";
  paymentStatus: "Paid" | "Pending" | "Partially Paid" | "Refunded";
  orderStatus: "Completed" | "Processing" | "Ready for Pickup" | "Cancelled";
  date: string;
  time: string;
  cashier: string;
  channel: "In-Store POS" | "Online Store" | "Wholesale Direct";
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: "Retail" | "Wholesale" | "VIP";
  totalOrders: number;
  totalSpent: number;
  outstandingBalance: number;
  creditLimit: number;
  lastVisit: string;
  status: "Active" | "Inactive";
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  category: string;
  pendingBills: number;
  leadTimeDays: number;
  rating: number;
  status: "Active" | "Under Review";
}

export interface InventoryMovement {
  id: string;
  sku: string;
  productName: string;
  type: "Restock" | "Sale" | "Adjustment" | "Transfer" | "Return";
  change: number;
  currentStock: number;
  location: string;
  date: string;
  performedBy: string;
  reason?: string;
}

export interface AiRecommendation {
  id: string;
  title: string;
  description: string;
  category: "Inventory" | "Pricing" | "Sales Surge" | "Customer Retention";
  confidence: number;
  actionText: string;
  impact: string;
  priority: "High" | "Medium" | "Low";
  date: string;
}

export interface Tenant {
  id: string;
  name: string;
  ownerEmail: string;
  plan: "Enterprise" | "Growth" | "Starter";
  branches: number;
  monthlyGmv: number;
  status: "Active" | "Trial" | "Suspended";
  joinedDate: string;
  dbHealth: "Optimal" | "Degraded";
}

// -------------------------------------------------------------
// Mock Datasets
// -------------------------------------------------------------

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    sku: "SKU-9921",
    barcode: "8901234567890",
    name: "Wireless ANC Pro Headphones",
    category: "Electronics",
    price: 199.99,
    cost: 110.0,
    stock: 42,
    minStock: 15,
    unit: "pcs",
    warehouse: "Main Warehouse A",
    status: "In Stock",
  },
  {
    id: "prod-002",
    sku: "SKU-8472",
    barcode: "8901234567891",
    name: "Ergonomic Mechanical Keyboard RGB",
    category: "Electronics",
    price: 129.5,
    cost: 68.0,
    stock: 18,
    minStock: 10,
    unit: "pcs",
    warehouse: "Main Warehouse A",
    status: "In Stock",
  },
  {
    id: "prod-003",
    sku: "SKU-3190",
    barcode: "8901234567892",
    name: "Organic Arabica Coffee Roast (1kg)",
    category: "Groceries & Beverage",
    price: 24.0,
    cost: 12.5,
    stock: 5,
    minStock: 20,
    unit: "bags",
    warehouse: "Store Front Retail",
    status: "Low Stock",
  },
  {
    id: "prod-004",
    sku: "SKU-4821",
    barcode: "8901234567893",
    name: "Precision Gaming Mouse 16000 DPI",
    category: "Electronics",
    price: 59.99,
    cost: 28.0,
    stock: 64,
    minStock: 15,
    unit: "pcs",
    warehouse: "Main Warehouse A",
    status: "In Stock",
  },
  {
    id: "prod-005",
    sku: "SKU-1029",
    barcode: "8901234567894",
    name: "Stainless Thermal Water Bottle 750ml",
    category: "Accessories",
    price: 19.99,
    cost: 8.2,
    stock: 0,
    minStock: 25,
    unit: "pcs",
    warehouse: "Store Front Retail",
    status: "Out of Stock",
  },
  {
    id: "prod-006",
    sku: "SKU-7723",
    barcode: "8901234567895",
    name: "Ultra-Fast USB-C GaN Charger 65W",
    category: "Accessories",
    price: 38.0,
    cost: 16.0,
    stock: 87,
    minStock: 20,
    unit: "pcs",
    warehouse: "Branch Warehouse B",
    status: "In Stock",
  },
  {
    id: "prod-007",
    sku: "SKU-6124",
    barcode: "8901234567896",
    name: "Smart Fitness Watch V3 Series",
    category: "Electronics",
    price: 149.0,
    cost: 75.0,
    stock: 8,
    minStock: 12,
    unit: "pcs",
    warehouse: "Main Warehouse A",
    status: "Low Stock",
  },
  {
    id: "prod-008",
    sku: "SKU-5542",
    barcode: "8901234567897",
    name: "Premium Vegan Leather Cardholder",
    category: "Accessories",
    price: 32.5,
    cost: 11.0,
    stock: 52,
    minStock: 10,
    unit: "pcs",
    warehouse: "Store Front Retail",
    status: "In Stock",
  },
];

export const MOCK_CATEGORIES = [
  "All Categories",
  "Electronics",
  "Groceries & Beverage",
  "Accessories",
  "Apparel",
  "Office Supplies",
];

export const MOCK_ORDERS: Order[] = [
  {
    id: "ord-101",
    orderNumber: "INV-2026-0841",
    customerName: "Eleanor Vance",
    customerPhone: "+1 (555) 234-8901",
    itemsCount: 3,
    total: 389.48,
    subtotal: 360.0,
    tax: 29.48,
    discount: 0.0,
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    orderStatus: "Completed",
    date: "2026-08-24",
    time: "14:22 PM",
    cashier: "Marcus Brody",
    channel: "In-Store POS",
  },
  {
    id: "ord-102",
    orderNumber: "INV-2026-0842",
    customerName: "Apex Retail Solutions Ltd",
    customerPhone: "+1 (555) 902-1144",
    itemsCount: 14,
    total: 1840.0,
    subtotal: 1900.0,
    tax: 140.0,
    discount: 200.0,
    paymentMethod: "Store Credit",
    paymentStatus: "Partially Paid",
    orderStatus: "Processing",
    date: "2026-08-24",
    time: "13:45 PM",
    cashier: "Sarah Jenkins",
    channel: "Wholesale Direct",
  },
  {
    id: "ord-103",
    orderNumber: "INV-2026-0843",
    customerName: "David K. Alvarez",
    customerPhone: "+1 (555) 349-7812",
    itemsCount: 1,
    total: 59.99,
    subtotal: 55.5,
    tax: 4.49,
    discount: 0.0,
    paymentMethod: "Mobile Pay",
    paymentStatus: "Paid",
    orderStatus: "Completed",
    date: "2026-08-24",
    time: "12:10 PM",
    cashier: "Marcus Brody",
    channel: "In-Store POS",
  },
  {
    id: "ord-104",
    orderNumber: "INV-2026-0844",
    customerName: "Sophia Chen",
    customerPhone: "+1 (555) 782-9901",
    itemsCount: 2,
    total: 223.99,
    subtotal: 210.0,
    tax: 13.99,
    discount: 0.0,
    paymentMethod: "Cash",
    paymentStatus: "Paid",
    orderStatus: "Completed",
    date: "2026-08-23",
    time: "17:30 PM",
    cashier: "Sarah Jenkins",
    channel: "In-Store POS",
  },
  {
    id: "ord-105",
    orderNumber: "INV-2026-0845",
    customerName: "Metro Logistics & Trade",
    customerPhone: "+1 (555) 601-3329",
    itemsCount: 28,
    total: 3420.5,
    subtotal: 3500.0,
    tax: 270.5,
    discount: 350.0,
    paymentMethod: "Credit Card",
    paymentStatus: "Pending",
    orderStatus: "Processing",
    date: "2026-08-23",
    time: "11:05 AM",
    cashier: "Marcus Brody",
    channel: "Online Store",
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "cust-01",
    name: "Eleanor Vance",
    phone: "+1 (555) 234-8901",
    email: "eleanor.vance@techcorp.io",
    type: "VIP",
    totalOrders: 28,
    totalSpent: 4890.0,
    outstandingBalance: 0,
    creditLimit: 2500,
    lastVisit: "Today, 14:22 PM",
    status: "Active",
  },
  {
    id: "cust-02",
    name: "Apex Retail Solutions Ltd",
    phone: "+1 (555) 902-1144",
    email: "procurement@apexretail.com",
    type: "Wholesale",
    totalOrders: 142,
    totalSpent: 38450.0,
    outstandingBalance: 3200.0,
    creditLimit: 15000,
    lastVisit: "Today, 13:45 PM",
    status: "Active",
  },
  {
    id: "cust-03",
    name: "David K. Alvarez",
    phone: "+1 (555) 349-7812",
    email: "d.alvarez@gmail.com",
    type: "Retail",
    totalOrders: 9,
    totalSpent: 620.0,
    outstandingBalance: 0,
    creditLimit: 500,
    lastVisit: "Today, 12:10 PM",
    status: "Active",
  },
  {
    id: "cust-04",
    name: "Sophia Chen",
    phone: "+1 (555) 782-9901",
    email: "sophia.chen@designhub.co",
    type: "Retail",
    totalOrders: 15,
    totalSpent: 1420.0,
    outstandingBalance: 0,
    creditLimit: 1000,
    lastVisit: "Yesterday",
    status: "Active",
  },
  {
    id: "cust-05",
    name: "Metro Logistics & Trade",
    phone: "+1 (555) 601-3329",
    email: "accounts@metrologistics.com",
    type: "Wholesale",
    totalOrders: 89,
    totalSpent: 62300.0,
    outstandingBalance: 5800.0,
    creditLimit: 20000,
    lastVisit: "2 days ago",
    status: "Active",
  },
];

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "sup-01",
    name: "OmniAudio Global Corp",
    company: "OmniAudio Tech Inc.",
    phone: "+1 (800) 441-2099",
    email: "orders@omniaudio.com",
    category: "Electronics",
    pendingBills: 4200.0,
    leadTimeDays: 4,
    rating: 4.9,
    status: "Active",
  },
  {
    id: "sup-02",
    name: "Highland Bean Exporters",
    company: "Highland Agro Ltd.",
    phone: "+1 (800) 332-9011",
    email: "supply@highlandbean.org",
    category: "Groceries & Beverage",
    pendingBills: 1150.0,
    leadTimeDays: 7,
    rating: 4.7,
    status: "Active",
  },
  {
    id: "sup-03",
    name: "Precision Peripheral MFG",
    company: "Precision Tech Asia",
    phone: "+86 755 8820 1190",
    email: "export@precisionmfg.cn",
    category: "Electronics",
    pendingBills: 8400.0,
    leadTimeDays: 14,
    rating: 4.8,
    status: "Active",
  },
];

export const MOCK_MOVEMENTS: InventoryMovement[] = [
  {
    id: "mov-01",
    sku: "SKU-3190",
    productName: "Organic Arabica Coffee Roast",
    type: "Sale",
    change: -2,
    currentStock: 5,
    location: "Store Front Retail",
    date: "2026-08-24 14:22",
    performedBy: "POS Register #1",
  },
  {
    id: "mov-02",
    sku: "SKU-7723",
    productName: "Ultra-Fast USB-C GaN Charger 65W",
    type: "Restock",
    change: 50,
    currentStock: 87,
    location: "Branch Warehouse B",
    date: "2026-08-24 10:15",
    performedBy: "Marcus Brody (Manager)",
  },
  {
    id: "mov-03",
    sku: "SKU-1029",
    productName: "Stainless Thermal Water Bottle",
    type: "Adjustment",
    change: -1,
    currentStock: 0,
    location: "Store Front Retail",
    date: "2026-08-23 18:00",
    performedBy: "Sarah Jenkins (Audit)",
    reason: "Damaged in transit",
  },
];

export const MOCK_AI_RECOMMENDATIONS: AiRecommendation[] = [
  {
    id: "rec-01",
    title: "Urgent Stock Reorder Recommended",
    description: "Arabica Coffee Roast (SKU-3190) has only 5 units left with an average velocity of 4.2 units/day. You will stock out in ~28 hours.",
    category: "Inventory",
    confidence: 96,
    actionText: "Generate PO to Highland Agro",
    impact: "+$850 Protected Revenue",
    priority: "High",
    date: "Generated 10 mins ago",
  },
  {
    id: "rec-02",
    title: "Dynamic Price Elasticity Opportunity",
    description: "Wireless ANC Pro Headphones (SKU-9921) have a 38% higher margin elasticity this week. Increasing price to $209.99 will not harm conversion.",
    category: "Pricing",
    confidence: 91,
    actionText: "Apply +5% Price Adjustment",
    impact: "+$420 Estimated Weekly Profit",
    priority: "Medium",
    date: "Generated 1 hour ago",
  },
  {
    id: "rec-03",
    title: "High-Value Inactive VIP Customer Alert",
    description: "Eleanor Vance has a 94% loyalty index but has not ordered accessories in 30 days. Send automated 10% personalized bundle invite.",
    category: "Customer Retention",
    confidence: 88,
    actionText: "Trigger SMS Promo",
    impact: "82% Expected Conversion",
    priority: "Medium",
    date: "Generated 3 hours ago",
  },
];

export const MOCK_TENANTS: Tenant[] = [
  {
    id: "tenant-01",
    name: "NextGen Flagship Retail Corp",
    ownerEmail: "admin@nextgenpos.com",
    plan: "Enterprise",
    branches: 8,
    monthlyGmv: 248900.0,
    status: "Active",
    joinedDate: "Jan 12, 2026",
    dbHealth: "Optimal",
  },
  {
    id: "tenant-02",
    name: "Nordic Tech Outfitters",
    ownerEmail: "finance@nordicoutfitters.se",
    plan: "Growth",
    branches: 3,
    monthlyGmv: 84200.0,
    status: "Active",
    joinedDate: "Mar 04, 2026",
    dbHealth: "Optimal",
  },
  {
    id: "tenant-03",
    name: "Sole & Leather Boutique",
    ownerEmail: "hello@soleleather.com",
    plan: "Starter",
    branches: 1,
    monthlyGmv: 18400.0,
    status: "Trial",
    joinedDate: "Aug 15, 2026",
    dbHealth: "Optimal",
  },
];
