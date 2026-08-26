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
  Star,
  Clock,
  ChevronRight,
  CreditCard,
  X,
  CheckCircle2,
} from "lucide-react";
import { MOCK_CUSTOMERS, MOCK_SUPPLIERS, Customer, Supplier } from "@/data/mockData";

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<"customers" | "suppliers">("customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);

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
      creditLimit: newCustType === "Wholesale" ? 10000 : 1000,
      lastVisit: "Just now",
      status: "Active",
    };
    setCustomers([newCust, ...customers]);
    setShowAddCustomer(false);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustEmail("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-slate-900">
            Customer CRM &amp; Supplier Ledger
          </h2>
          <p className="text-xs text-slate-500">
            Manage VIP customer loyalty points, wholesale credit balances, and vendor procurement accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCustomer(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Account</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab & Search Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("customers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "customers"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customer Registry ({customers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("suppliers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "suppliers"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Supplier Accounts ({suppliers.length})</span>
            </button>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email or company..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Tab 1: Customer Registry */}
        {activeTab === "customers" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Customer Profile</th>
                  <th className="px-6 py-3">Account Tier</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3 text-center">Orders</th>
                  <th className="px-6 py-3 text-right">Lifetime Spend</th>
                  <th className="px-6 py-3 text-right">Outstanding Balance</th>
                  <th className="px-6 py-3 text-right">Credit Limit</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-heading font-bold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-400">Last visited {cust.lastVisit}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          cust.type === "VIP"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : cust.type === "Wholesale"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {cust.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="text-slate-700 font-medium">{cust.phone}</div>
                      <div className="text-[11px] text-slate-400">{cust.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-semibold text-slate-700">
                      {cust.totalOrders}
                    </td>
                    <td className="px-6 py-4 text-right font-heading font-bold text-slate-900">
                      ${cust.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold">
                      {cust.outstandingBalance > 0 ? (
                        <span className="text-rose-600">
                          ${cust.outstandingBalance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-emerald-600">$0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-500">
                      ${cust.creditLimit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Supplier Accounts */}
        {activeTab === "suppliers" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Supplier / Company</th>
                  <th className="px-6 py-3">Category Supplied</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3 text-center">Avg Lead Time</th>
                  <th className="px-6 py-3 text-center">Score</th>
                  <th className="px-6 py-3 text-right">Payable Balance</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-heading font-bold text-slate-900">{sup.company}</div>
                      <div className="text-[11px] text-slate-400">Rep: {sup.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {sup.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="text-slate-700 font-medium">{sup.phone}</div>
                      <div className="text-[11px] text-slate-400">{sup.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-medium text-slate-700">
                      {sup.leadTimeDays} Days
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{sup.rating}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                      ${sup.pendingBills.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Create PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Ledger Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  {selectedCustomer.name}
                </h3>
                <span className="text-[11px] font-semibold text-indigo-600">
                  {selectedCustomer.type} Tier Account
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Spent to Date:</span>
                <span className="font-bold text-slate-900">${selectedCustomer.totalSpent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Outstanding Receivable Balance:</span>
                <span className="font-bold text-rose-600">${selectedCustomer.outstandingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Available Credit Margin:</span>
                <span className="font-bold text-emerald-600">
                  ${(selectedCustomer.creditLimit - selectedCustomer.outstandingBalance).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Payment receipt recorded for ${selectedCustomer.name}`);
                  setSelectedCustomer(null);
                }}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Register Customer Account
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name / Business Title</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Apex Distribution Ltd"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="accounts@apex.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Tier</label>
                <select
                  value={newCustType}
                  onChange={(e) => setNewCustType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
