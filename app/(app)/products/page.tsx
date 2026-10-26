"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Barcode,
  Printer,
  X,
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
      sku: `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
      barcode: `890123${Math.floor(100000 + Math.random() * 900000)}`,
      name: newProductName,
      category: newProductCategory,
      price: Number(newProductPrice),
      cost: Number(newProductCost),
      stock: Number(newProductStock),
      minStock: 10,
      unit: "pcs",
      warehouse: "Central Warehouse",
      status: Number(newProductStock) > 10 ? "In Stock" : "Low Stock",
    };

    setProducts([newProduct, ...products]);
    setShowAddModal(false);
    setNewProductName("");
  };

  return (
    <div className="space-y-5">
      {/* Product Catalog Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-lg p-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by SKU, barcode, or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none font-medium"
          >
            {MOCK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "All Categories" ? "All categories" : c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs transition-colors tactile-btn flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add product</span>
          </button>
        </div>
      </div>

      {/* High-Density Catalog Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs text-zinc-500">
                <th className="py-2.5 px-4 font-semibold">SKU</th>
                <th className="py-2.5 px-4 font-semibold">Product name</th>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold text-right">Unit cost</th>
                <th className="py-2.5 px-4 font-semibold text-right">Retail price</th>
                <th className="py-2.5 px-4 font-semibold text-right">Gross margin</th>
                <th className="py-2.5 px-4 font-semibold text-right">Stock balance</th>
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Barcode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map((p) => {
                const margin = ((p.price - p.cost) / p.price) * 100;
                return (
                  <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-zinc-900">{p.sku}</td>
                    <td className="py-3 px-4 font-sans font-medium text-zinc-800">{p.name}</td>
                    <td className="py-3 px-4 text-zinc-600">{p.category}</td>
                    <td className="py-3 px-4 text-right text-zinc-600">${p.cost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-900">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-emerald-700">
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-900">
                      {p.stock} <span className="font-normal text-zinc-500 text-xs">{p.unit}</span>
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
                        onClick={() => setSelectedBarcodeProduct(p)}
                        className="px-2.5 py-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded text-xs font-medium transition-colors tactile-btn inline-flex items-center gap-1.5"
                      >
                        <Barcode className="w-3 h-3 text-zinc-500" />
                        <span>Print label</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Label Modal */}
      {selectedBarcodeProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className="font-heading font-bold text-sm text-zinc-950">
                Barcode label print
              </span>
              <button
                type="button"
                onClick={() => setSelectedBarcodeProduct(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded text-center space-y-2">
              <div className="font-heading font-bold text-xs text-zinc-900 truncate">
                {selectedBarcodeProduct.name}
              </div>
              <div className="font-mono text-sm font-bold text-blue-700">
                ${selectedBarcodeProduct.price.toFixed(2)}
              </div>
              <div className="py-3 px-2 bg-white border border-zinc-200 rounded inline-block">
                {/* SVG Barcode Representation */}
                <div className="flex items-center justify-center gap-[2px] h-12 px-4">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 1].map(
                    (w, idx) => (
                      <div
                        key={idx}
                        className={`bg-zinc-900 h-full ${
                          idx % 2 === 0 ? "opacity-100" : "opacity-0"
                        }`}
                        style={{ width: `${w * 1.5}px` }}
                      />
                    )
                  )}
                </div>
                <div className="font-mono text-xs tracking-widest text-zinc-600 mt-1">
                  {selectedBarcodeProduct.barcode}
                </div>
              </div>
              <div className="text-xs font-mono text-zinc-500">
                SKU: {selectedBarcodeProduct.sku}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedBarcodeProduct(null)}
                className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded text-xs tactile-btn"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs tactile-btn flex items-center gap-1.5 font-mono"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAddProduct}
            className="bg-white border border-zinc-200 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h4 className="font-heading font-bold text-sm text-zinc-950">
                Add new product
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Product name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Specialty Roasted Colombian Beans"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none"
                  >
                    {MOCK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Initial stock units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Unit cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Retail price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded text-xs tactile-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs tactile-btn"
              >
                Save product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
