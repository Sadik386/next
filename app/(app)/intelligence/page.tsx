"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Boxes,
  BellRing,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Store,
  Receipt,
  Save,
} from "lucide-react";
import { MOCK_AI_RECOMMENDATIONS, AiRecommendation } from "@/data/mockData";

export default function IntelligencePage() {
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>(MOCK_AI_RECOMMENDATIONS);
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(true);
  const [dynamicPricingEnabled, setDynamicPricingEnabled] = useState(false);
  const [safetyStockMultiplier, setSafetyStockMultiplier] = useState("1.35x");
  const [storeName, setStoreName] = useState("DokanDar Flagship Retail Corp");
  const [taxRate, setTaxRate] = useState(8.0);
  const [receiptFooter, setReceiptFooter] = useState("Thank you for shopping with DokanDar Commerce. Return within 30 days.");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAction = (id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top AI Neural Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-semibold backdrop-blur-md mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Neural Demand Forecasting &amp; Optimization Engine</span>
          </div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight">
            Autonomous Commerce Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl">
            Real-time inference running on POS registers, supplier lead times, and seasonal trend signals.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Model Active (v4.2-pro)</span>
          </span>
        </div>
      </div>

      {/* Grid: AI Action Cards & Automated Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900">
            Pending High-Impact Opportunities ({recommendations.length})
          </h3>

          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-200 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      rec.priority === "High"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {rec.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{rec.date}</span>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {rec.confidence}% Model Confidence
                </span>
              </div>

              <div>
                <h4 className="font-heading font-bold text-sm text-slate-900 mb-1">
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-emerald-600 font-mono">
                  {rec.impact}
                </span>
                <button
                  type="button"
                  onClick={() => handleAction(rec.id)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  {rec.actionText}
                </button>
              </div>
            </div>
          ))}

          {recommendations.length === 0 && (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">All AI recommendations processed!</p>
              <p className="text-[11px]">System will notify you as new sales patterns emerge.</p>
            </div>
          )}
        </div>

        {/* Right Col: Autonomous Control Toggles */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 self-start">
          <h3 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            Autonomous Automation Policies
          </h3>

          <div className="space-y-4 text-xs">
            {/* Toggle 1 */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-slate-800">Auto-Draft Supplier POs</div>
                <div className="text-slate-500 text-[11px]">
                  Draft purchase order when stock drops below safety threshold
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoReorderEnabled}
                onChange={(e) => setAutoReorderEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Toggle 2 */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-slate-800">Dynamic Elasticity Margin</div>
                <div className="text-slate-500 text-[11px]">
                  Auto-adjust retail prices within ±5% based on local velocity
                </div>
              </div>
              <input
                type="checkbox"
                checked={dynamicPricingEnabled}
                onChange={(e) => setDynamicPricingEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-1 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Weekend Surge Safety Multiplier
              </label>
              <select
                value={safetyStockMultiplier}
                onChange={(e) => setSafetyStockMultiplier(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="1.20x">1.20x (Standard Buffer)</option>
                <option value="1.35x">1.35x (Recommended Optimal)</option>
                <option value="1.50x">1.50x (Aggressive Buffer)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Store Configuration Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
          Store Profile &amp; POS Receipt Configuration
        </h3>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Business Registered Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Default POS Tax Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-semibold mb-1">Thermal Receipt Footer Policy</label>
            <input
              type="text"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration saved successfully!</span>
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">Last synced to all local POS terminals</span>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
