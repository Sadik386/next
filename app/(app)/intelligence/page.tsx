"use client";

import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  Boxes,
  CheckCircle2,
  Sliders,
  Store,
  Receipt,
  Save,
  AlertCircle,
} from "lucide-react";

interface TelemetryAlert {
  id: string;
  sku: string;
  productName: string;
  daysOfSupplyRemaining: number;
  recommendedOrderUnits: number;
  expectedTurnaroundDays: number;
  priority: "High" | "Medium" | "Low";
}

const INITIAL_ALERTS: TelemetryAlert[] = [
  {
    id: "alt-1",
    sku: "SKU-10294",
    productName: "Specialty Roasted Arabica Beans",
    daysOfSupplyRemaining: 4,
    recommendedOrderUnits: 60,
    expectedTurnaroundDays: 3,
    priority: "High",
  },
  {
    id: "alt-2",
    sku: "SKU-44102",
    productName: "Unbleached Paper Filters V60",
    daysOfSupplyRemaining: 6,
    recommendedOrderUnits: 150,
    expectedTurnaroundDays: 5,
    priority: "Medium",
  },
  {
    id: "alt-3",
    sku: "SKU-88219",
    productName: "Ceramic Dripper Set Matte White",
    daysOfSupplyRemaining: 8,
    recommendedOrderUnits: 25,
    expectedTurnaroundDays: 7,
    priority: "Low",
  },
];

export default function IntelligencePage() {
  const [alerts, setAlerts] = useState<TelemetryAlert[]>(INITIAL_ALERTS);
  const [safetyMultiplier, setSafetyMultiplier] = useState("1.35x");
  const [storeName, setStoreName] = useState("NextGen Flagship Retail Corp");
  const [taxRate, setTaxRate] = useState(8.0);
  const [receiptFooter, setReceiptFooter] = useState(
    "Thank you for shopping with us. Returns accepted within 30 days with receipt."
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Telemetry Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-lg p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-700"></span>
            <span className="text-xs font-mono text-zinc-500">
              Run-rate and restock schedules
            </span>
          </div>
          <h2 className="font-heading font-bold text-base text-zinc-950 mt-1">
            Demand forecasts and restock planning
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-medium">
            Calculations current
          </div>
        </div>
      </div>

      {/* Asymmetric 7 / 5 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 Columns: Actionable Reorder Alerts */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-lg shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h3 className="font-heading font-bold text-sm text-zinc-950">
                Replenishment suggestions
              </h3>
              <p className="text-xs text-zinc-500">
                Calculated from 30-day register sales and vendor lead times.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {alerts.length} active notices
            </span>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-zinc-900 text-sm font-sans">{alert.productName}</div>
                    <div className="text-xs font-mono text-zinc-500 mt-0.5">
                      SKU {alert.sku}, Lead time: {alert.expectedTurnaroundDays} days
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      alert.priority === "High"
                        ? "bg-red-50 text-red-800 border border-red-200"
                        : alert.priority === "Medium"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {alert.priority} priority
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/80 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500">Supply remaining: </span>
                    <span className="font-bold text-zinc-900">{alert.daysOfSupplyRemaining} days</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Recommended order: </span>
                    <span className="font-bold text-blue-700">+{alert.recommendedOrderUnits} units</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleDismissAlert(alert.id)}
                    className="px-2.5 py-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded text-xs tactile-btn"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismissAlert(alert.id)}
                    className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs tactile-btn"
                  >
                    Create purchase order
                  </button>
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="py-12 text-center text-xs font-mono text-zinc-400">
                All SKUs maintain sufficient warehouse run-rate.
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Operating Parameters Configuration */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-lg shadow-2xs p-5 space-y-4">
          <div className="pb-3 border-b border-zinc-100">
            <h3 className="font-heading font-bold text-sm text-zinc-950">
              Register and policy settings
            </h3>
            <p className="text-xs text-zinc-500">
              Configure inventory buffer calculations and receipt metadata.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Store trade name (Receipt header)
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Safety stock buffer
                </label>
                <select
                  value={safetyMultiplier}
                  onChange={(e) => setSafetyMultiplier(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 font-mono text-xs text-zinc-800 focus:outline-none"
                >
                  <option value="1.15x">1.15x (+15% cushion)</option>
                  <option value="1.35x">1.35x (+35% cushion)</option>
                  <option value="1.50x">1.50x (+50% cushion)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Standard tax rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Receipt footer note
              </label>
              <textarea
                rows={3}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded p-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {savedSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Settings saved to database.</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs tactile-btn flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save settings</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
