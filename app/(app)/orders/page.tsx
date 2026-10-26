"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  Printer,
  X,
} from "lucide-react";
import { MOCK_ORDERS, Order } from "@/data/mockData";

export default function OrdersPage() {
  const [orders] = useState<Order[]>(MOCK_ORDERS);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === "All" ||
      o.orderStatus === statusFilter ||
      (statusFilter === "Paid" && o.paymentStatus === "Paid");
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalVolume = orders.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="space-y-5">
      {/* 3 Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Total invoiced volume
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-950 mb-1">
            ${totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500">Across retail POS and wholesale orders</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Fulfilled orders
          </div>
          <div className="font-mono font-bold text-2xl text-emerald-700 mb-1">
            {orders.filter((o) => o.orderStatus === "Completed").length} / {orders.length}
          </div>
          <div className="text-xs text-emerald-800">Completed without returns</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            In-flight processing
          </div>
          <div className="font-mono font-bold text-2xl text-blue-700 mb-1">
            {orders.filter((o) => o.orderStatus === "Processing").length} orders
          </div>
          <div className="text-xs text-zinc-500">Queued for courier pickup</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-lg p-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order ID or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none font-medium"
          >
            <option value="All">All statuses</option>
            <option value="Completed">Completed</option>
            <option value="Processing">Processing</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs text-zinc-500">
                <th className="py-2.5 px-4 font-semibold">Order ID</th>
                <th className="py-2.5 px-4 font-semibold">Date and time</th>
                <th className="py-2.5 px-4 font-semibold">Customer account</th>
                <th className="py-2.5 px-4 font-semibold">Channel</th>
                <th className="py-2.5 px-4 font-semibold">Payment tender</th>
                <th className="py-2.5 px-4 font-semibold text-right">Items</th>
                <th className="py-2.5 px-4 font-semibold text-right">Net total</th>
                <th className="py-2.5 px-4 font-semibold text-center">Fulfillment</th>
                <th className="py-2.5 px-4 font-semibold text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-zinc-900">{o.orderNumber}</td>
                  <td className="py-3 px-4 text-zinc-500">
                    {o.date}, {o.time}
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-zinc-800">{o.customerName}</td>
                  <td className="py-3 px-4 text-zinc-600">{o.channel}</td>
                  <td className="py-3 px-4 text-zinc-600">{o.paymentMethod}</td>
                  <td className="py-3 px-4 text-right font-bold text-zinc-900">{o.itemsCount}</td>
                  <td className="py-3 px-4 text-right font-bold text-zinc-950">
                    ${o.total.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        o.orderStatus === "Completed"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {o.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(o)}
                      className="px-2.5 py-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-blue-700 rounded text-xs font-semibold transition-colors tactile-btn inline-flex items-center gap-1.5"
                    >
                      <FileText className="w-3 h-3 text-zinc-500" />
                      <span>View invoice</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Invoice Document Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700" />
                <span className="font-heading font-bold text-sm text-zinc-950">
                  Tax invoice {selectedInvoice.orderNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded p-4 font-mono text-xs space-y-3">
              <div className="flex justify-between items-start pb-3 border-b border-zinc-200">
                <div>
                  <div className="font-bold text-zinc-900 text-sm">NextGen Cloud POS</div>
                  <div className="text-xs text-zinc-500">Downtown Central Flagship</div>
                  <div className="text-xs text-zinc-500">Tax Reg: TX-882941-C</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-zinc-900">{selectedInvoice.orderNumber}</div>
                  <div className="text-xs text-zinc-500">{selectedInvoice.date}</div>
                  <div className="text-xs text-emerald-800 font-semibold mt-0.5">Paid in full</div>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="text-zinc-500 font-medium">Billed to:</div>
                <div className="font-bold font-sans text-zinc-900">{selectedInvoice.customerName}</div>
                <div className="text-zinc-600">Sales channel: {selectedInvoice.channel}</div>
                <div className="text-zinc-600">Tender: {selectedInvoice.paymentMethod}</div>
              </div>

              <div className="pt-2 border-t border-zinc-200 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal amount</span>
                  <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Standard tax (8%)</span>
                  <span>${selectedInvoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-950 text-sm pt-2 border-t border-zinc-200">
                  <span>Net invoice total</span>
                  <span className="text-blue-700">${selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
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
                <span>Print invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
