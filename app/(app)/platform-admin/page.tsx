"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Building,
  Activity,
  HardDrive,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
  Plus,
} from "lucide-react";
import { MOCK_TENANTS, Tenant } from "@/data/mockData";

export default function PlatformAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGmv = tenants.reduce((acc, t) => acc + t.monthlyGmv, 0);

  return (
    <div className="space-y-6">
      {/* Top Platform Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Multi-Tenant Enterprise Governance</span>
          </div>
          <h2 className="font-heading font-bold text-xl text-slate-900">
            Super-Admin &amp; Platform Architecture
          </h2>
        </div>

        <button
          type="button"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Tenant Instance</span>
        </button>
      </div>

      {/* 4 Super-Admin Infrastructure Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Active Tenant Organizations
          </div>
          <div className="font-heading font-extrabold text-2xl text-slate-900 mb-1">
            {tenants.length} Tenants
          </div>
          <div className="text-xs text-indigo-600 font-semibold">12 Connected Terminals</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Network GMV Processed
          </div>
          <div className="font-heading font-extrabold text-2xl text-slate-900 mb-1">
            ${totalGmv.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-600 font-semibold">Real-time aggregate</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Database Cluster Health
          </div>
          <div className="font-heading font-extrabold text-2xl text-emerald-600 mb-1">
            99.99% Uptime
          </div>
          <div className="text-xs text-slate-500">Sub-12ms latency across shards</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Security &amp; Audit Status
          </div>
          <div className="font-heading font-extrabold text-2xl text-indigo-600 mb-1">
            Compliant
          </div>
          <div className="text-xs text-slate-500">SOC2 Type II &amp; GDPR Mapped</div>
        </div>
      </div>

      {/* Tenant Organizations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">
              Provisioned Commerce Tenants
            </h3>
            <p className="text-xs text-slate-500">
              Multi-tenant isolation, branch quotas, and plan tier limits
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenant or owner email..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Tenant Name</th>
                <th className="px-6 py-3">Owner Contact</th>
                <th className="px-6 py-3">Tier Plan</th>
                <th className="px-6 py-3 text-center">Branches</th>
                <th className="px-6 py-3 text-right">Monthly GMV</th>
                <th className="px-6 py-3">Cluster Status</th>
                <th className="px-6 py-3 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-heading font-bold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-400">Created: {t.joinedDate}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-mono text-[11px]">
                    {t.ownerEmail}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-slate-800">
                    {t.branches} Outlets
                  </td>
                  <td className="px-6 py-4 text-right font-heading font-bold text-slate-900">
                    ${t.monthlyGmv.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{t.dbHealth}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Audit &amp; Shards
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Event Stream */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
          Real-Time Platform Security &amp; Access Log
        </h3>
        <div className="space-y-2 text-xs font-mono">
          {[
            {
              time: "2026-08-24 14:32:10 UTC",
              actor: "marcus.brody@dokandar.com",
              action: "AUTH_TERMINAL_SESSION_GRANTED",
              ip: "192.168.1.104 (POS #01)",
              status: "SUCCESS",
            },
            {
              time: "2026-08-24 13:45:00 UTC",
              actor: "system.autonomous.sync",
              action: "INVENTORY_REORDER_TRIGGERED",
              ip: "10.0.4.12 (Daemon)",
              status: "SUCCESS",
            },
            {
              time: "2026-08-24 11:12:44 UTC",
              actor: "admin@nordicoutfitters.se",
              action: "API_SECRET_ROTATION",
              ip: "83.250.12.89 (Stockholm)",
              status: "SUCCESS",
            },
          ].map((log, i) => (
            <div
              key={i}
              className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{log.time}</span>
                <span className="font-bold text-slate-800">{log.actor}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-indigo-700 font-semibold">{log.action}</span>
                <span className="text-slate-500">{log.ip}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
