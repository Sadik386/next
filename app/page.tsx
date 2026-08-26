import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Receipt,
  LayoutDashboard,
  Boxes,
  Package,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-extrabold text-xl tracking-tight text-white">
              DokanDar
            </div>
            <div className="text-[11px] font-semibold tracking-wider text-indigo-400 uppercase">
              Commerce Platform
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>DokanDar Next-Gen Commerce Suite</span>
        </div>

        <h1 className="font-heading font-extrabold text-4xl sm:text-6xl text-white tracking-tight leading-tight max-w-4xl mb-6">
          Intelligent POS, Inventory Control &amp; Commerce Intelligence
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          High-performance unified retail &amp; wholesale platform. Real-time multi-warehouse stock sync, lightning-fast POS register, automated P&amp;L analytics, and AI demand forecasting.
        </p>

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl text-left">
          <Link
            href="/dashboard"
            className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/60 hover:bg-slate-800 transition-all group backdrop-blur-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white mb-1 group-hover:text-indigo-400 transition-colors">
              Executive Dashboard
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time revenue metrics, profit margins, sales velocity, and low-stock alerts.
            </p>
          </Link>

          <Link
            href="/pos"
            className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/60 hover:bg-slate-800 transition-all group backdrop-blur-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white mb-1 group-hover:text-emerald-400 transition-colors">
              POS Terminal
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sub-second touch checkout, barcode scanning, split tenders, and instant receipts.
            </p>
          </Link>

          <Link
            href="/inventory"
            className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/60 hover:bg-slate-800 transition-all group backdrop-blur-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white mb-1 group-hover:text-amber-400 transition-colors">
              Stock &amp; Inventory
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-warehouse tracking, stock transfers, batch adjustments, and reorder triggers.
            </p>
          </Link>

          <Link
            href="/platform-admin"
            className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/60 hover:bg-slate-800 transition-all group backdrop-blur-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white mb-1 group-hover:text-cyan-400 transition-colors">
              Super-Admin
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tenant orchestration, audit trail governance, and API health telemetry.
            </p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 relative z-10">
        © 2026 DokanDar Commerce OS — Precision Engineered for High Growth Enterprises.
      </footer>
    </div>
  );
}
