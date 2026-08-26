"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  Printer,
  Download,
  Percent,
  X,
  CheckCircle2,
} from "lucide-react";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, Product } from "@/data/mockData";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | null>(null);

  // New Product Form State
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Electronics");
  const [newProductPrice, setNewProductPrice] = useState(49.99);
  const [newProductCost, setNewProductCost] = useState(25.0);
  const [newProductStock, setNewProductStock] = useState(30);

  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === "All Categories" || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `890123${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: newProductName,
      category: newProductCategory,
      price: Number(newProductPrice),
      cost: Number(newProductCost),
      stock: Number(newProductStock),
      minStock: 10,
      unit: "pcs",
      warehouse: "Main Warehouse A",
      status: Number(newProductStock) > 10 ? "In Stock" : "Low Stock",
    };

    setProducts([newProduct, ...products]);
    setShowAddModal(false);
    setNewProductName("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-slate-900">
            Product Catalog &amp; Barcode Management
          </h2>
          <p className="text-xs text-slate-500">
            Maintain master SKU registry, retail markups, barcode standards, and supplier mapping.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New SKU</span>
          </button>
        </div>
      </div>

      {/* Main Catalog Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {MOCK_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, title or barcode..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Product Name &amp; SKU</th>
                <th className="px-6 py-3">Barcode</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Cost Price</th>
                <th className="px-6 py-3 text-right">Retail Price</th>
                <th className="px-6 py-3 text-right">Gross Margin</th>
                <th className="px-6 py-3 text-center">Available Stock</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const margin = (((p.price - p.cost) / p.price) * 100).toFixed(1);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-heading font-bold text-slate-900">{p.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{p.sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedBarcodeProduct(p)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 font-mono text-[11px] text-slate-700 transition-colors"
                      >
                        <Barcode className="w-3.5 h-3.5 text-slate-500" />
                        <span>{p.barcode}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{p.category}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-500">
                      ${p.cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        <Percent className="w-3 h-3" />
                        <span>{margin}%</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-heading font-bold text-slate-900">
                      {p.stock} {p.unit}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => setSelectedBarcodeProduct(p)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Print Barcode Label"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Register New SKU
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Product Title</label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Ultra HD 4K Webcam Pro"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Groceries & Beverage">Groceries &amp; Beverage</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Apparel">Apparel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Initial Opening Stock (Units)</label>
                <input
                  type="number"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Save SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Label Modal */}
      {selectedBarcodeProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-heading font-bold text-xs text-slate-900">Thermal Barcode Tag</span>
              <button
                type="button"
                onClick={() => setSelectedBarcodeProduct(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
              <div className="font-heading font-bold text-xs text-slate-900 truncate max-w-[220px]">
                {selectedBarcodeProduct.name}
              </div>
              <div className="text-base font-extrabold font-mono text-indigo-700">
                ${selectedBarcodeProduct.price.toFixed(2)}
              </div>

              {/* Barcode graphic visualization */}
              <div className="py-2 px-4 bg-white border border-slate-300 rounded-lg flex flex-col items-center">
                <div className="flex items-center gap-[2px] h-12">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 3, 1, 2, 4, 1, 3].map((w, i) => (
                    <div
                      key={i}
                      style={{ width: `${w * 2}px` }}
                      className="h-full bg-slate-900"
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] tracking-widest text-slate-600 mt-1">
                  {selectedBarcodeProduct.barcode}
                </span>
              </div>
              <div className="font-mono text-[10px] text-slate-400">
                SKU: {selectedBarcodeProduct.sku}
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Label Sticker</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
