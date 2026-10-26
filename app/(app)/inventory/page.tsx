"use client";

import React, { useState } from "react";
import {
  Boxes,
  Search,
  Plus,
  AlertTriangle,
  Building,
  History,
  X,
  CheckCircle2,
} from "lucide-react";
import { MOCK_PRODUCTS, MOCK_MOVEMENTS, Product } from "@/data/mockData";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All Warehouses");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<"inventory" | "movements">("inventory");

  // Stock Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(10);
  const [adjustReason, setAdjustReason] = useState("Stock Restock Delivery");

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesWarehouse = warehouseFilter === "All Warehouses" || p.warehouse === warehouseFilter;
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWarehouse && matchesStatus && matchesSearch;
  });

  const totalAssetValue = products.reduce((acc, p) => acc + p.cost * p.stock, 0);
  const lowStockCount = products.filter((p) => p.status === "Low Stock").length;
  const outOfStockCount = products.filter((p) => p.status === "Out of Stock").length;

  const handleApplyAdjustment = () => {
    if (!selectedProduct) return;
    const newStock = Math.max(0, selectedProduct.stock + adjustAmount);
    const newStatus: "In Stock" | "Low Stock" | "Out of Stock" =
      newStock === 0 ? "Out of Stock" : newStock <= selectedProduct.minStock ? "Low Stock" : "In Stock";

    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProduct.id
          ? { ...p, stock: newStock, status: newStatus }
          : p
      )
    );
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-5">
      {/* 4 Core Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Total inventory valuation
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-950 mb-1">
            ${totalAssetValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500">Asset valuation at cost basis</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Tracked SKUs
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-950 mb-1">
            {products.length}
          </div>
          <div className="text-xs text-zinc-500">Across 3 regional facilities</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Low stock alerts
          </div>
          <div className="font-mono font-bold text-2xl text-amber-700 mb-1">
            {lowStockCount}
          </div>
          <div className="text-xs text-amber-800">Below safety thresholds</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Out of stock
          </div>
          <div className="font-mono font-bold text-2xl text-red-700 mb-1">
            {outOfStockCount}
          </div>
          <div className="text-xs text-red-800">Zero units on shelves</div>
        </div>
      </div>

      {/* Control Strip & Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`px-3 py-1.5 rounded text-xs transition-colors tactile-btn ${
              activeTab === "inventory"
                ? "bg-blue-700 text-white font-semibold"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            Stock balance ledger
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("movements")}
            className={`px-3 py-1.5 rounded text-xs transition-colors tactile-btn ${
              activeTab === "movements"
                ? "bg-blue-700 text-white font-semibold"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            Audit movements
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none font-medium"
          >
            <option value="All Warehouses">All facilities</option>
            <option value="Central Warehouse">Central Facility</option>
            <option value="West Distribution Center">West Distribution</option>
            <option value="Express Outlet Storage">Express Storage</option>
          </select>
        </div>
      </div>

      {/* Main High-Density Inventory Table */}
      {activeTab === "inventory" ? (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs text-zinc-500">
                  <th className="py-2.5 px-4 font-semibold">SKU</th>
                  <th className="py-2.5 px-4 font-semibold">Product description</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold">Warehouse</th>
                  <th className="py-2.5 px-4 font-semibold text-right">In stock</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Minimum safe</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-zinc-900">{p.sku}</td>
                    <td className="py-3 px-4 font-sans font-medium text-zinc-800">{p.name}</td>
                    <td className="py-3 px-4 text-zinc-600">{p.category}</td>
                    <td className="py-3 px-4 text-zinc-600">{p.warehouse}</td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-900">
                      {p.stock} <span className="font-normal text-zinc-500 text-xs">{p.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-500">
                      {p.minStock} {p.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          p.status === "In Stock"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : p.status === "Low Stock"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(p);
                          setAdjustAmount(10);
                        }}
                        className="px-2.5 py-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-blue-700 rounded text-xs font-semibold transition-colors tactile-btn"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Movements Audit Table */
        <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs text-zinc-500">
                  <th className="py-2.5 px-4 font-semibold">Date and time</th>
                  <th className="py-2.5 px-4 font-semibold">SKU</th>
                  <th className="py-2.5 px-4 font-semibold">Product</th>
                  <th className="py-2.5 px-4 font-semibold">Type</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Change</th>
                  <th className="py-2.5 px-4 font-semibold">Location</th>
                  <th className="py-2.5 px-4 font-semibold">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {MOCK_MOVEMENTS.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4 text-zinc-500">{m.date}</td>
                    <td className="py-3 px-4 font-bold text-zinc-900">{m.sku}</td>
                    <td className="py-3 px-4 font-sans font-medium text-zinc-800">{m.productName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {m.type}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        m.change > 0 ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {m.change > 0 ? `+${m.change}` : m.change}
                    </td>
                    <td className="py-3 px-4 text-zinc-600">{m.location}</td>
                    <td className="py-3 px-4 text-zinc-700">{m.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h4 className="font-heading font-bold text-sm text-zinc-950">
                  Adjust stock balance
                </h4>
                <div className="text-xs font-mono text-zinc-500">
                  {selectedProduct.sku}, {selectedProduct.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Quantity change (positive to add, negative to deduct)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 font-mono text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <div className="text-xs font-mono text-zinc-500 mt-1">
                  Current: {selectedProduct.stock} {selectedProduct.unit} → New balance:{" "}
                  {Math.max(0, selectedProduct.stock + adjustAmount)} {selectedProduct.unit}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Reason for adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none"
                >
                  <option value="Stock Restock Delivery">Shipment intake</option>
                  <option value="Damaged Inventory Disposal">Damaged goods write-off</option>
                  <option value="Inventory Reconciliation Audit">Physical inventory count correction</option>
                  <option value="Customer Return Stocked">Customer return restock</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded text-xs font-medium tactile-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyAdjustment}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs tactile-btn"
              >
                Save adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
