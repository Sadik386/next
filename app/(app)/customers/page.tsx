"use client";

import React, { useState } from "react";
import {
  Users,
  Building2,
  Search,
  Plus,
  Phone,
  Mail,
  DollarSign,
  X,
} from "lucide-react";
import { MOCK_CUSTOMERS, MOCK_SUPPLIERS, Customer, Supplier } from "@/data/mockData";

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<"customers" | "suppliers">("customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [suppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // New Customer State
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustType, setNewCustType] = useState<"Retail" | "Wholesale" | "VIP">("Retail");

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail,
      type: newCustType,
      totalOrders: 0,
      totalSpent: 0,
      outstandingBalance: 0,
      creditLimit: newCustType === "Wholesale" ? 15000 : 2500,
      lastVisit: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Active",
    };

    setCustomers([newCust, ...customers]);
    setShowAddCustomer(false);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustEmail("");
  };

  const totalReceivables = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
  const totalPayables = suppliers.reduce((acc, s) => acc + s.pendingBills, 0);

  return (
    <div className="space-y-5">
      {/* Financial Receivables & Payables Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Accounts receivable
          </div>
          <div className="font-mono font-bold text-2xl text-amber-700 mb-1">
            ${totalReceivables.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500">
            Unsettled customer credit balances
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Accounts payable
          </div>
          <div className="font-mono font-bold text-2xl text-red-700 mb-1">
            ${totalPayables.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500">
            Outstanding vendor invoices due
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Active directory
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-950 mb-1">
            {customers.length + suppliers.length} <span className="text-sm font-normal text-zinc-500">accounts</span>
          </div>
          <div className="text-xs text-zinc-500">
            {customers.length} buyers, {suppliers.length} vendor suppliers
          </div>
        </div>
      </div>

      {/* Control Strip & Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`px-3 py-1.5 rounded text-xs transition-colors tactile-btn ${
              activeTab === "customers"
                ? "bg-blue-700 text-white font-semibold"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            Customer accounts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("suppliers")}
            className={`px-3 py-1.5 rounded text-xs transition-colors tactile-btn ${
              activeTab === "suppliers"
                ? "bg-blue-700 text-white font-semibold"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            Vendor suppliers
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          {activeTab === "customers" && (
            <button
              type="button"
              onClick={() => setShowAddCustomer(true)}
              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs transition-colors tactile-btn flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {activeTab === "customers" ? (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs text-zinc-500">
                  <th className="py-2.5 px-4 font-semibold">Customer name</th>
                  <th className="py-2.5 px-4 font-semibold">Account tier</th>
                  <th className="py-2.5 px-4 font-semibold">Contact info</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Orders</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Lifetime spend</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Credit balance</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Credit limit</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-zinc-900">{c.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {c.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600">
                      <div>{c.phone}</div>
                      <div className="text-xs text-zinc-400">{c.email}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-900">{c.totalOrders}</td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-950">
                      ${c.totalSpent.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        c.outstandingBalance > 0 ? "text-amber-700" : "text-emerald-700"
                      }`}
                    >
                      ${c.outstandingBalance.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-500">
                      ${c.creditLimit.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="px-2.5 py-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-blue-700 rounded text-xs font-semibold transition-colors tactile-btn"
                      >
                        Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Suppliers Table */
        <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs text-zinc-500">
                  <th className="py-2.5 px-4 font-semibold">Vendor company</th>
                  <th className="py-2.5 px-4 font-semibold">Representative</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold">Contact email</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Lead time</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Pending payables</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-zinc-900">{s.company}</td>
                    <td className="py-3 px-4 font-sans text-zinc-700">{s.name}</td>
                    <td className="py-3 px-4 text-zinc-600">{s.category}</td>
                    <td className="py-3 px-4 text-zinc-600">{s.email}</td>
                    <td className="py-3 px-4 text-right text-zinc-900 font-bold">{s.leadTimeDays} days</td>
                    <td className="py-3 px-4 text-right font-bold text-red-700">
                      ${s.pendingBills.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Account Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h4 className="font-heading font-bold text-sm text-zinc-950">
                  {selectedCustomer.name}
                </h4>
                <div className="text-xs font-mono text-zinc-500">
                  Account #{selectedCustomer.id}, Tier: {selectedCustomer.type}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total invoiced:</span>
                  <span className="font-bold text-zinc-900">${selectedCustomer.totalSpent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Current balance due:</span>
                  <span className="font-bold text-amber-700">
                    ${selectedCustomer.outstandingBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Approved credit limit:</span>
                  <span className="text-zinc-900">${selectedCustomer.creditLimit.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs font-sans">
                <div className="text-zinc-500 font-medium">Contact information:</div>
                <div className="text-zinc-800 font-mono">{selectedCustomer.phone}</div>
                <div className="text-zinc-800">{selectedCustomer.email}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded text-xs tactile-btn"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs tactile-btn"
              >
                Record payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateCustomer}
            className="bg-white border border-zinc-200 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h4 className="font-heading font-bold text-sm text-zinc-950">
                Register customer account
              </h4>
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Customer or business name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Henderson"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Phone number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 0192"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Account tier
                  </label>
                  <select
                    value={newCustType}
                    onChange={(e) => setNewCustType(e.target.value as any)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none"
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="liam.henderson@example.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded text-xs tactile-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs tactile-btn"
              >
                Save account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
