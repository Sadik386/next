"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  Download,
  Printer,
  X,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { MOCK_ORDERS, Order } from "@/data/mockData";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
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
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Total Sales Invoiced
          </div>
          <div className="font-heading font-extrabold text-2xl text-slate-900 mb-1">
            ${totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-600 font-semibold">+12.4% vs last period</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Active Fulfillment Queue
          </div>
          <div className="font-heading font-extrabold text-2xl text-indigo-600 mb-1">
            2 In-Flight Orders
          </div>
          <div className="text-xs text-slate-500">Processing ready for dispatch</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Payment Clearance
          </div>
          <div className="font-heading font-extrabold text-2xl text-emerald-600 mb-1">
            98.5% Settled
          </div>
          <div className="text-xs text-slate-500">Fast multi-tender reconciliation</div>
        </div>
      </div>

      {/* Main Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["All", "Completed", "Processing", "Paid"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === status
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice # or customer..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Invoice Number</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Channel / Terminal</th>
                <th className="px-6 py-3">Items Count</th>
                <th className="px-6 py-3">Tender Method</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Fulfillment</th>
                <th className="px-6 py-3 text-right">Total ($)</th>
                <th className="px-6 py-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      {order.date} {order.time}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{order.customerName}</div>
                    <div className="text-[11px] text-slate-400">{order.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{order.channel}</td>
                  <td className="px-6 py-4 text-center font-mono font-semibold text-slate-700">
                    {order.itemsCount} lines
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        order.paymentStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : order.paymentStatus === "Partially Paid"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        order.orderStatus === "Completed"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-heading font-bold text-sm text-slate-900">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(order)}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Invoice Drawer / Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Tax Invoice Document
                </h3>
                <p className="text-xs font-mono text-indigo-600 font-semibold">
                  {selectedInvoice.orderNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 font-sans">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-heading font-bold text-sm text-slate-900">
                    DokanDar Flagship Store
                  </div>
                  <div className="text-slate-500 text-[11px]">742 Evergreen Plaza, Suite 400</div>
                  <div className="text-slate-500 text-[11px]">GST / Tax ID: TAX-99482-US</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-slate-500 text-[11px]">Date: {selectedInvoice.date}</div>
                  <div className="text-slate-500 text-[11px]">Cashier: {selectedInvoice.cashier}</div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Billed Customer
                </div>
                <div className="font-bold text-slate-900">{selectedInvoice.customerName}</div>
                <div className="text-slate-500 text-[11px]">{selectedInvoice.customerPhone}</div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal</span>
                  <span className="font-mono">${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Standard VAT / GST (8%)</span>
                  <span className="font-mono">${selectedInvoice.tax.toFixed(2)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Applied Wholesale Discount</span>
                    <span className="font-mono">-${selectedInvoice.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-300 font-bold text-sm text-slate-900">
                  <span>Total Amount Paid</span>
                  <span className="font-mono text-indigo-700">${selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
