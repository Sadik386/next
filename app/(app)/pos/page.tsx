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
} from "lucide-react";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, Product, CartItem } from "@/data/mockData";

export default function PosPage() {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories] = useState<string[]>(MOCK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([
    { ...MOCK_PRODUCTS[0], quantity: 1, discount: 0 },
    { ...MOCK_PRODUCTS[2], quantity: 2, discount: 0 },
  ]);
  const [selectedPayment, setSelectedPayment] = useState<"Credit Card" | "Cash" | "Mobile Pay">("Credit Card");
  const [customerName] = useState("Eleanor Vance");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter products by category and query
  const filteredProducts = products.filter((p) => {
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    const orderData = {
      orderNumber: `INV-${Date.now().toString().slice(-6)}`,
      customerName,
      items: [...cart],
      subtotal,
      tax,
      total,
      paymentMethod: selectedPayment,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };

    try {
      await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.id, quantity: i.quantity, price: i.price })),
          paymentMethod: selectedPayment,
          total,
          subtotal,
          tax,
          customerName,
        }),
      });
    } catch {
      // Offline fallback
    }

    setLastCompletedOrder(orderData);
    setIsProcessing(false);
    setShowReceiptModal(true);
    setCart([]);
  };

  return (
    <div className="space-y-4">
      {/* POS Sub-Header / Barcode Instant Entry & Stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-lg p-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Barcode className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Scan barcode or enter SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded pl-9 pr-3 py-1.5 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
              autoFocus
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-zinc-400 hover:text-zinc-600 px-2"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded text-zinc-600">
            {filteredProducts.length} items in catalog
          </div>
          <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-blue-800">
            {cart.length} items in cart
          </div>
        </div>
      </div>

      {/* Asymmetric 65 / 35 Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 Columns (Catalog & Touch Grid) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition-colors tactile-btn ${
                  selectedCategory === cat
                    ? "bg-blue-700 text-white shadow-2xs font-semibold"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= product.minStock;

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => addToCart(product)}
                  className={`text-left p-3.5 rounded-lg border transition-all text-xs flex flex-col justify-between tactile-btn ${
                    isOutOfStock
                      ? "bg-zinc-100 border-zinc-200 opacity-60 cursor-not-allowed"
                      : "bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                      <span>{product.sku}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-sans text-[10px] font-medium ${
                          isOutOfStock
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : isLowStock
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {product.stock} {product.unit}
                      </span>
                    </div>
                    <div className="font-semibold text-zinc-900 leading-snug line-clamp-2">
                      {product.name}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between">
                    <div className="font-mono font-bold text-sm text-zinc-950">
                      ${product.price.toFixed(2)}
                    </div>
                    <span className="text-xs text-blue-700 font-semibold">
                      Add
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center space-y-2">
              <div className="font-heading font-semibold text-sm text-zinc-800">
                No matching products found
              </div>
              <p className="text-xs text-zinc-500 font-mono">
                Scan another barcode sequence or clear the search filter.
              </p>
            </div>
          )}
        </div>

        {/* Right 5 Columns (Tactile Register Tape & Checkout) */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-lg shadow-xs flex flex-col sticky top-20">
          {/* Register Tape Header */}
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
            <div>
              <div className="font-heading font-bold text-sm text-zinc-950">Active ticket tape</div>
              <div className="text-xs font-mono text-zinc-500">
                Register 01, Cashier on duty
              </div>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-medium text-red-700 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear cart</span>
              </button>
            )}
          </div>

          {/* Customer Selection Row */}
          <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-600 font-medium">Customer:</span>
              <span className="font-semibold text-zinc-900">{customerName}</span>
            </div>
            <span className="text-xs font-medium text-blue-700 cursor-pointer hover:underline">
              Change
            </span>
          </div>

          {/* Cart Items List */}
          <div className="p-4 max-h-[360px] overflow-y-auto divide-y divide-zinc-100 flex-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-zinc-400">
                <Receipt className="w-8 h-8 mx-auto stroke-1" />
                <div className="text-xs font-mono text-zinc-500">The register cart is empty.</div>
                <div className="text-xs text-zinc-400">
                  Select products from the catalog or scan an item barcode.
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-zinc-900 truncate">{item.name}</div>
                    <div className="text-xs font-mono text-zinc-500">
                      {item.sku}, ${item.price.toFixed(2)} / {item.unit}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-700 tactile-btn"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-zinc-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-700 tactile-btn"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="w-16 text-right font-mono font-bold text-zinc-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-zinc-400 hover:text-red-700 p-1"
                    title="Remove item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Pricing Ledger & Payment Method */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 space-y-3">
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Standard tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                <span>Total payable</span>
                <span className="text-blue-700">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Tender Options */}
            <div className="pt-2">
              <div className="text-xs font-medium text-zinc-600 mb-1.5">
                Payment method
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Credit Card", label: "Card POS", icon: CreditCard },
                  { id: "Cash", label: "Cash", icon: Banknote },
                  { id: "Mobile Pay", label: "bKash / Nagad", icon: Smartphone },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = selectedPayment === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedPayment(m.id as any)}
                      className={`p-2 rounded text-center text-xs font-medium border flex flex-col items-center gap-1 transition-colors tactile-btn ${
                        isSelected
                          ? "bg-blue-50 border-blue-700 text-blue-900 font-semibold"
                          : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[11px] truncate w-full">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Execute Settlement Button */}
            <button
              type="button"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors tactile-btn font-mono"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isProcessing ? "Processing..." : `Charge $${total.toFixed(2)}`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Settlement Receipt Modal */}
      {showReceiptModal && lastCompletedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span className="font-heading font-bold text-sm text-zinc-950">
                  Sale finalized
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Print Slip Mock */}
            <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded p-4 font-mono text-xs space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-zinc-200">
                <div className="font-bold text-zinc-900">NextGen Cloud POS</div>
                <div className="text-[11px] text-zinc-500">Terminal 01, Flagship Store</div>
                <div className="text-[11px] text-zinc-500">
                  {lastCompletedOrder.date}, {lastCompletedOrder.time}
                </div>
                <div className="text-xs font-bold text-zinc-800 mt-1">
                  Order #{lastCompletedOrder.orderNumber}
                </div>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {lastCompletedOrder.items.map((i: CartItem) => (
                  <div key={i.id} className="flex justify-between text-xs">
                    <span className="truncate w-36">
                      {i.quantity}x {i.name}
                    </span>
                    <span>${(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-zinc-200 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span>${lastCompletedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Tax (8%)</span>
                  <span>${lastCompletedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-950 text-xs pt-1 border-t border-zinc-200">
                  <span>Total paid ({lastCompletedOrder.paymentMethod})</span>
                  <span>${lastCompletedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 tactile-btn font-mono"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Thermal print</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded text-xs font-semibold tactile-btn"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
