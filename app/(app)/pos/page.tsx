"use client";

import React, { useState } from "react";
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Printer,
  X,
  User,
  ShoppingBag,
  RotateCcw,
} from "lucide-react";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, Product, CartItem } from "@/data/mockData";

export default function PosPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([
    { ...MOCK_PRODUCTS[0], quantity: 1, discount: 0 },
    { ...MOCK_PRODUCTS[2], quantity: 2, discount: 0 },
  ]);
  const [selectedPayment, setSelectedPayment] = useState<"Cash" | "Credit Card" | "Mobile Pay">("Credit Card");
  const [customerName, setCustomerName] = useState("Eleanor Vance (VIP)");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);

  // Filtered products
  const filteredProducts = MOCK_PRODUCTS.filter((p) => {
    const matchesCat = selectedCategory === "All Categories" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Pricing calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const orderData = {
      orderNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      items: [...cart],
      subtotal,
      tax,
      total,
      paymentMethod: selectedPayment,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };
    setLastCompletedOrder(orderData);
    setShowReceiptModal(true);
  };

  const handleReceiptClose = () => {
    setShowReceiptModal(false);
    clearCart();
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row gap-6">
      {/* Left Column: Product Catalog & Fast POS Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 overflow-hidden">
        {/* Top Controls: Search Bar & Barcode Scanner */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by name, SKU or scan barcode..."
              className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center gap-1">
              <Barcode className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 shrink-0">
          {MOCK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pr-1">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all select-none ${
                  isOutOfStock
                    ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                    : "bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer group"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {product.sku}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        product.status === "In Stock"
                          ? "bg-emerald-50 text-emerald-700"
                          : product.status === "Low Stock"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {product.stock} {product.unit}
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-xs text-slate-900 line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h4>
                  <div className="text-[11px] text-slate-400">{product.category}</div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <div className="font-heading font-extrabold text-sm text-slate-900">
                    ${product.price.toFixed(2)}
                  </div>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Register Cart & Instant Checkout */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col shrink-0 overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Active Sale Order
            </h3>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              <User className="w-3 h-3" />
            </div>
            <select
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer truncate"
            >
              <option value="Eleanor Vance (VIP)">Eleanor Vance (VIP)</option>
              <option value="Apex Retail Solutions Ltd (Wholesale)">Apex Retail Solutions Ltd (Wholesale)</option>
              <option value="David K. Alvarez (Retail)">David K. Alvarez (Retail)</option>
              <option value="Walk-in Customer (Guest)">Walk-in Customer (Guest)</option>
            </select>
          </div>
          <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
            VIP 5% OFF
          </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Receipt className="w-10 h-10 stroke-1" />
              <p className="text-xs">No items in the register.</p>
              <p className="text-[11px] text-slate-400">Click products or scan barcodes to begin sale.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-heading font-semibold text-xs text-slate-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-5 text-center font-mono">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Calculation Summary & Tender Selector */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST/VAT 8%)</span>
                <span className="font-mono font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Total Due</span>
                <span className="font-heading font-extrabold text-base text-indigo-600 font-mono">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedPayment("Credit Card")}
                className={`py-2 px-1 rounded-lg border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  selectedPayment === "Credit Card"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayment("Cash")}
                className={`py-2 px-1 rounded-lg border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  selectedPayment === "Cash"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayment("Mobile Pay")}
                className={`py-2 px-1 rounded-lg border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  selectedPayment === "Mobile Pay"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>

            {/* Checkout Action */}
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Charge &amp; Issue Receipt (${total.toFixed(2)})</span>
            </button>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && lastCompletedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900">
                    Payment Successful
                  </h3>
                  <p className="text-[11px] text-slate-400">{lastCompletedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReceiptClose}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
              <div className="text-center font-bold text-sm text-slate-900 pb-2 border-b border-dashed border-slate-300">
                DOKANDAR COMMERCE STORE
                <div className="text-[10px] font-normal text-slate-500">Downtown Flagship Terminal #01</div>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Customer:</span>
                <span>{lastCompletedOrder.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Tender:</span>
                <span>{lastCompletedOrder.paymentMethod}</span>
              </div>
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                {lastCompletedOrder.items.map((item: CartItem) => (
                  <div key={item.id} className="flex justify-between text-[11px]">
                    <span>{item.quantity}x {item.name.substring(0, 22)}...</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between font-bold text-slate-900 text-xs">
                <span>TOTAL PAID</span>
                <span>${lastCompletedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal</span>
              </button>
              <button
                type="button"
                onClick={handleReceiptClose}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
