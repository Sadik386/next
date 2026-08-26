"use client";

import React, { useState } from "react";
import {
  Boxes,
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Building,
  History,
  X,
  RotateCcw,
} from "lucide-react";
import { MOCK_PRODUCTS, MOCK_MOVEMENTS, Product } from "@/data/mockData";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All Warehouses");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<"inventory" | "movements">("inventory");
  
  // Stock Adjustment Modal State
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
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Total Inventory Value
          </div>
          <div className="font-heading font-extrabold text-2xl text-slate-900 mb-1">
            ${totalAssetValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500">Asset cost basis valuation</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Total Tracked SKUs
          </div>
          <div className="font-heading font-extrabold text-2xl text-slate-900 mb-1">
            {products.length} Items
          </div>
          <div className="text-xs text-emerald-600 font-semibold">100% Barcode Mapped</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Low Stock Threshold
          </div>
          <div className="font-heading font-extrabold text-2xl text-amber-600 mb-1">
            {lowStockCount} SKUs
          </div>
          <div className="text-xs text-amber-700">Restock reorder triggered</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Out of Stock
          </div>
          <div className="font-heading font-extrabold text-2xl text-rose-600 mb-1">
            {outOfStockCount} SKUs
          </div>
          <div className="text-xs text-rose-700">Immediate supplier PO required</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Card Header & Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tab Selection */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "inventory"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Live Warehouse Stock
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("movements")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "movements"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Stock Movement Audit
            </button>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by SKU or name..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Warehouse Filter */}
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none"
            >
              <option value="All Warehouses">All Warehouses</option>
              <option value="Main Warehouse A">Main Warehouse A</option>
              <option value="Store Front Retail">Store Front Retail</option>
              <option value="Branch Warehouse B">Branch Warehouse B</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Tab 1: Inventory Table */}
        {activeTab === "inventory" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">SKU / Item</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Warehouse Location</th>
                  <th className="px-6 py-3 text-center">Available Units</th>
                  <th className="px-6 py-3 text-center">Min Reorder</th>
                  <th className="px-6 py-3 text-right">Asset Cost</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-heading font-bold text-slate-900">{product.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{product.category}</td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{product.warehouse}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-heading font-bold text-slate-900">
                      {product.stock} {product.unit}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500 font-mono">
                      {product.minStock} {product.unit}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                      ${(product.cost * product.stock).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          product.status === "In Stock"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : product.status === "Low Stock"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Movement Audit Log */}
        {activeTab === "movements" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">SKU / Product</th>
                  <th className="px-6 py-3">Movement Type</th>
                  <th className="px-6 py-3 text-center">Change</th>
                  <th className="px-6 py-3">Warehouse</th>
                  <th className="px-6 py-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_MOVEMENTS.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500">{mov.date}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {mov.productName}
                      <span className="font-mono font-normal text-slate-400 ml-2">({mov.sku})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {mov.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold">
                      <span className={mov.change >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        {mov.change > 0 ? `+${mov.change}` : mov.change}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{mov.location}</td>
                    <td className="px-6 py-4 text-slate-500">{mov.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Stock Adjustment
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedProduct.sku} — {selectedProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                <span className="text-slate-600 font-medium">Current Stock Level:</span>
                <span className="font-heading font-bold text-sm text-slate-900 font-mono">
                  {selectedProduct.stock} {selectedProduct.unit}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Adjustment Quantity (+ / -)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Adjustment</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                >
                  <option value="Stock Restock Delivery">Stock Restock Delivery</option>
                  <option value="Damaged / Broken in Transit">Damaged / Broken in Transit</option>
                  <option value="Inventory Physical Count Audit">Inventory Physical Count Audit</option>
                  <option value="Customer Return to Stock">Customer Return to Stock</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyAdjustment}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
