"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Building2,
  Users,
  Search,
  Plus,
  X,
} from "lucide-react";
import { MOCK_TENANTS, Tenant } from "@/data/mockData";

export default function PlatformAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newPlan, setNewPlan] = useState<"Starter" | "Growth" | "Enterprise">("Growth");

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGmv = tenants.reduce((acc, t) => acc + t.monthlyGmv, 0);

  const handleProvisionTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const newTenant: Tenant = {
      id: `ten-${Date.now()}`,
      name: newBusinessName,
      ownerEmail: newOwnerEmail,
      plan: newPlan,
      branches: 1,
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Active",
      monthlyGmv: 0,
      dbHealth: "Optimal",
    };

    setTenants([newTenant, ...tenants]);
    setShowProvisionModal(false);
    setNewBusinessName("");
    setNewOwnerEmail("");
  };

  return (
    <div className="space-y-5">
      {/* Top Platform Overview */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-lg p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-700"></span>
            <span className="text-xs font-mono text-zinc-500">
              Multi-store directory
            </span>
          </div>
          <h2 className="font-heading font-bold text-base text-zinc-950 mt-1">
            Tenant business directory
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowProvisionModal(true)}
          className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs transition-colors tactile-btn flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add business</span>
        </button>
      </div>

      {/* 3 Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Registered businesses
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-950 mb-1">
            {tenants.length} <span className="text-sm font-normal text-zinc-500">organizations</span>
          </div>
          <div className="text-xs text-zinc-500">
            Isolated tenant databases
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Network GMV invoiced
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-950 mb-1">
            ${totalGmv.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-800">
            Across all tenant registers
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            Active register terminals
          </div>
          <div className="font-mono font-bold text-2xl text-blue-700 mb-1">
            {tenants.reduce((acc, t) => acc + t.branches, 0)} <span className="text-sm font-normal text-zinc-500">units</span>
          </div>
          <div className="text-xs text-zinc-500">
            Connected in-store checkouts
          </div>
        </div>
      </div>

      {/* Tenant Directory Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search business name or owner email..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div className="text-xs font-mono text-zinc-500">
            Showing {filteredTenants.length} of {tenants.length} businesses
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs text-zinc-500">
                <th className="py-2.5 px-4 font-semibold">Business name</th>
                <th className="py-2.5 px-4 font-semibold">Owner email</th>
                <th className="py-2.5 px-4 font-semibold">Subscription tier</th>
                <th className="py-2.5 px-4 font-semibold text-center">Branches</th>
                <th className="py-2.5 px-4 font-semibold text-right">Monthly GMV</th>
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-zinc-900">
                    <div>{t.name}</div>
                    <div className="text-xs font-mono text-zinc-500 font-normal">
                      Joined {t.joinedDate}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-600">{t.ownerEmail}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {t.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-zinc-900">{t.branches}</td>
                  <td className="py-3 px-4 text-right font-bold text-zinc-950">
                    ${t.monthlyGmv.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-blue-700 rounded text-xs font-semibold transition-colors tactile-btn"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Tenant Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleProvisionTenant}
            className="bg-white border border-zinc-200 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h4 className="font-heading font-bold text-sm text-zinc-950">
                Add business organization
              </h4>
              <button
                type="button"
                onClick={() => setShowProvisionModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Business name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Coffee Roasters"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Owner email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@apexcoffee.com"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Subscription tier
                </label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as any)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none font-medium"
                >
                  <option value="Starter">Starter (1 Terminal)</option>
                  <option value="Growth">Growth (Up to 5 Outlets)</option>
                  <option value="Enterprise">Enterprise (Unlimited Outlets)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowProvisionModal(false)}
                className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded text-xs tactile-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs tactile-btn"
              >
                Create organization
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
