"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Play,
  Check,
  CreditCard,
  AlertTriangle,
  Receipt,
  Boxes,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Smartphone,
  CheckCircle2,
  BarChart3,
  Layers,
} from "lucide-react";

export default function LandingPage() {
  const [activePlan, setActivePlan] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#161628] relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Ambient Glow & Grid Pattern */}
      <div className="absolute top-0 right-0 w-[800px] h-[700px] bg-gradient-to-bl from-purple-200/40 via-indigo-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[300px] left-[-100px] w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/30 via-indigo-50/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. Header / Navbar */}
      <header className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between relative z-20">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-current"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div className="font-heading font-extrabold text-xl tracking-tight text-[#161628]">
            NextGen <span className="text-[#6366F1]">POS</span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#55556E]">
          <div className="flex items-center gap-1 hover:text-[#161628] cursor-pointer transition-colors">
            <span>Features</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8E8EA8]" />
          </div>
          <a href="#pricing" className="hover:text-[#161628] transition-colors">
            Pricing
          </a>
          <div className="flex items-center gap-1 hover:text-[#161628] cursor-pointer transition-colors">
            <span>Resources</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8E8EA8]" />
          </div>
        </nav>

        {/* Right CTA Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-xl text-sm font-medium text-[#2C2C3E] border border-zinc-200/80 bg-white/70 hover:bg-white hover:border-zinc-300 shadow-xs transition-all"
          >
            Log In
          </Link>
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-sm shadow-indigo-500/25 transition-all"
          >
            Launch POS
          </Link>
        </div>
      </header>

      {/* 2. Main Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-6 md:pt-14 pb-20 md:pb-28 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Bold Copy & Call-To-Actions */}
          <div className="lg:col-span-6 space-y-7 z-10">
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-[58px] text-[#161628] tracking-tight leading-[1.08]">
              The Smart POS to <br className="hidden sm:inline" />
              Grow Your Business
            </h1>

            <p className="text-base sm:text-lg text-[#55556E] max-w-lg leading-relaxed">
              Track live sales, manage inventory, and speed up checkouts with the all-in-one platform designed for modern retail.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="px-8 py-3.5 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white font-semibold text-sm rounded-full shadow-[0_10px_24px_rgba(99,102,241,0.38)] hover:shadow-[0_12px_28px_rgba(99,102,241,0.48)] hover:-translate-y-0.5 transition-all tactile-btn"
              >
                Start Free Trial
              </Link>
              <Link
                href="/pos"
                className="px-6 py-3.5 bg-white/80 hover:bg-white text-[#2C2C3E] border border-zinc-200/80 font-semibold text-sm rounded-full shadow-xs hover:border-zinc-300 transition-all flex items-center gap-2.5 group"
              >
                <span>Watch Demo</span>
                <span className="w-5 h-5 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-600 group-hover:border-[#6366F1] group-hover:text-[#6366F1] transition-colors">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </span>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-3 pt-4">
              <div className="flex -space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Merchant"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Merchant"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  alt="Merchant"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                />
              </div>
              <span className="text-xs font-medium text-[#7D7D93]">
                Trusted by 10,000+ merchants
              </span>
            </div>
          </div>

          {/* Right Column: 3D Isometric Glassmorphic Hero Visual */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[460px] select-none">
            {/* Perspective Grid Background */}
            <div className="absolute inset-0 isometric-grid-bg opacity-40 rounded-3xl [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)] pointer-events-none" />

            {/* Glowing Refractive Spheres */}
            <div className="absolute top-4 right-16 w-20 h-20 rounded-full bg-gradient-to-tr from-white/70 via-purple-300/40 to-indigo-400/20 backdrop-blur-md border border-white/80 shadow-[inset_0_4px_12px_rgba(255,255,255,0.9),0_12px_24px_rgba(139,92,246,0.18)] animate-float-gentle pointer-events-none" />
            <div className="absolute bottom-8 left-10 w-16 h-16 rounded-full bg-gradient-to-tr from-white/80 via-blue-200/30 to-purple-400/20 backdrop-blur-md border border-white/80 shadow-[inset_0_4px_10px_rgba(255,255,255,0.9),0_10px_20px_rgba(99,102,241,0.15)] animate-float-reverse pointer-events-none" />
            
            {/* Small Ambient Glow Spheres */}
            <div className="absolute top-1/2 left-4 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 blur-xs shadow-md shadow-indigo-500/50" />
            <div className="absolute bottom-4 right-1/3 w-4 h-4 rounded-full bg-indigo-600 shadow-sm shadow-indigo-600" />

            {/* Translucent 3D Isometric Torus / Ring Decoration on Bottom Right */}
            <div className="absolute -bottom-4 -right-4 w-28 h-28 rounded-full border-[10px] border-purple-300/50 [transform:rotateX(60deg)_rotateZ(30deg)] shadow-lg shadow-purple-500/10 pointer-events-none" />

            {/* Composition Wrapper */}
            <div className="relative w-full max-w-[500px]">
              {/* Back Isometric Platform Plate */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-purple-200/40 via-white/30 to-indigo-100/40 rounded-3xl border border-white/60 blur-[1px] -z-10 [transform:perspective(1000px)_rotateY(-6deg)_rotateX(8deg)]" />

              {/* CARD 1: Top Main "Live Sales" */}
              <div className="glass-card-hero rounded-3xl p-5 md:p-6 mb-4 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-sm font-semibold text-zinc-700">Live Sales</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F9F0] text-[#00BA66] tracking-tight">
                    +18.4% today
                  </span>
                </div>

                <div className="text-2xl md:text-3xl font-heading font-black text-zinc-950 tracking-tight my-1">
                  $14,250.80
                </div>

                {/* Smooth Chart Line */}
                <div className="pt-2">
                  <svg viewBox="0 0 320 80" className="w-full h-18 overflow-visible">
                    <defs>
                      <linearGradient id="liveSalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818CF8" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#C084FC" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Fill Area */}
                    <path
                      d="M 0 65 Q 40 60 70 45 T 140 40 T 210 25 T 280 15 L 320 10 L 320 80 L 0 80 Z"
                      fill="url(#liveSalesGrad)"
                    />
                    {/* Glowing Stroke Path */}
                    <path
                      d="M 0 65 Q 40 60 70 45 T 140 40 T 210 25 T 280 15 L 320 10"
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Lower Dual Grid: Inventory Alerts + Fast Checkout UI */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                {/* CARD 2: Bottom-Left "Inventory Alerts" (7 cols) */}
                <div className="sm:col-span-7 glass-card-hero rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-800">Inventory Alerts</span>
                    <span className="text-zinc-400 text-xs">•••</span>
                  </div>

                  <div className="mt-2.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-sm">⚠️</span>
                      <div>
                        <div className="text-[11px] font-bold text-amber-950">
                          Low Stock Alert:
                        </div>
                        <div className="text-[10px] text-amber-800 font-medium">
                          Organic Coffee (5 left)
                        </div>
                      </div>
                    </div>
                    <span className="text-xs">⚠️ ⚠️</span>
                  </div>

                  {/* Thumbnail Row */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="w-6 h-6 rounded-md bg-zinc-200 border border-zinc-300 flex items-center justify-center text-[10px]">☕</div>
                    <div className="w-6 h-6 rounded-md bg-zinc-200 border border-zinc-300 flex items-center justify-center text-[10px]">🧃</div>
                    <div className="w-6 h-6 rounded-md bg-zinc-200 border border-zinc-300 flex items-center justify-center text-[10px]">🍫</div>
                  </div>
                </div>

                {/* CARD 3: Right "Fast Checkout UI" (5 cols) */}
                <div className="sm:col-span-5 glass-card-hero rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 space-y-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[11px] font-bold text-zinc-800">Fast Checkout UI</span>
                    <span className="text-zinc-400 text-xs">•••</span>
                  </div>

                  {/* Scannable Barcode */}
                  <div className="p-2 rounded-xl bg-white border border-zinc-100 flex flex-col items-center">
                    <svg viewBox="0 0 140 32" className="w-full h-8">
                      <rect x="5" y="0" width="3" height="32" fill="#181829" />
                      <rect x="12" y="0" width="5" height="32" fill="#181829" />
                      <rect x="20" y="0" width="2" height="32" fill="#181829" />
                      <rect x="25" y="0" width="4" height="32" fill="#181829" />
                      <rect x="33" y="0" width="2" height="32" fill="#181829" />
                      <rect x="38" y="0" width="6" height="32" fill="#181829" />
                      <rect x="48" y="0" width="3" height="32" fill="#181829" />
                      <rect x="55" y="0" width="4" height="32" fill="#181829" />
                      <rect x="63" y="0" width="2" height="32" fill="#181829" />
                      <rect x="68" y="0" width="5" height="32" fill="#181829" />
                      <rect x="76" y="0" width="3" height="32" fill="#181829" />
                      <rect x="83" y="0" width="5" height="32" fill="#181829" />
                      <rect x="91" y="0" width="2" height="32" fill="#181829" />
                      <rect x="96" y="0" width="6" height="32" fill="#181829" />
                      <rect x="105" y="0" width="3" height="32" fill="#181829" />
                      <rect x="112" y="0" width="4" height="32" fill="#181829" />
                      <rect x="120" y="0" width="5" height="32" fill="#181829" />
                      <rect x="128" y="0" width="3" height="32" fill="#181829" />
                    </svg>
                    <span className="text-[9px] font-mono text-zinc-400 mt-0.5">Scannable barcode</span>
                  </div>

                  {/* Payment Button */}
                  <div className="p-2 rounded-xl bg-white border border-zinc-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      <div>
                        <div className="text-[10px] text-zinc-400 font-medium leading-none">Quick Payment</div>
                        <div className="font-bold text-zinc-900 mt-0.5">Pay $32.00</div>
                      </div>
                    </div>
                    <span className="text-zinc-400">›</span>
                  </div>

                  {/* Payment Successful Badge */}
                  <div className="px-2 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5 text-[10px] font-bold justify-center">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    <span>Payment Successful</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature Highlights Bento Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 border-t border-zinc-200/60">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            Engineered for High-Velocity Retail
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#161628] tracking-tight mt-3">
            Everything your store needs in one place
          </h2>
          <p className="text-sm sm:text-base text-[#666680] mt-2">
            Eliminate register downtime, stock discrepancies, and manual accounting headaches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-7 border border-zinc-200/70 shadow-xs hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-zinc-950">
              Lightning Fast POS Checkout
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 mt-2 leading-relaxed">
              Scan barcodes in under 120ms with hardware scanners, phone pairing, or USB webcams. Instant receipt thermal printing.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-7 border border-zinc-200/70 shadow-xs hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-zinc-950">
              Multi-Warehouse Stock Ledger
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 mt-2 leading-relaxed">
              Track SKUs across multiple branches, set automatic low-stock reorder thresholds, and transfer inventory between stores effortlessly.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-7 border border-zinc-200/70 shadow-xs hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-zinc-950">
              Real-Time Financial Intelligence
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 mt-2 leading-relaxed">
              Automated profit and loss statements, sales margin analysis, and daily register batch reconciliation ready with one click.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Interactive Live Register Preview CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="bg-gradient-to-r from-[#1E1E2F] to-[#161624] text-white rounded-[32px] p-8 md:p-14 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-white/10 text-indigo-300 border border-white/10">
              Instant Web POS Ready
            </span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight leading-tight">
              Experience the fast NextGen terminal live in your browser.
            </h2>
            <p className="text-sm text-zinc-400">
              No installation required. Test barcode scans, register cart operations, and receipt generation in seconds.
            </p>
            <div className="pt-3 flex flex-wrap gap-3">
              <Link
                href="/pos"
                className="px-6 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold text-xs rounded-full shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
              >
                <span>Open Live Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-full border border-white/15 transition-all"
              >
                View Management Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#161628] tracking-tight">
            Transparent Pricing Plans
          </h2>
          <p className="text-sm text-[#666680] mt-2">
            Flexible options whether you run a boutique counter or a multi-location enterprise.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-2 p-1 bg-zinc-200/60 rounded-full mt-6">
            <button
              onClick={() => setActivePlan("monthly")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activePlan === "monthly" ? "bg-white text-zinc-950 shadow-xs" : "text-zinc-600"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setActivePlan("yearly")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activePlan === "yearly" ? "bg-white text-zinc-950 shadow-xs" : "text-zinc-600"
              }`}
            >
              Yearly <span className="text-[10px] text-emerald-600 font-bold ml-1">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Starter Plan */}
          <div className="bg-white rounded-3xl p-7 border border-zinc-200/70 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-600">Starter Store</div>
              <div className="font-heading font-extrabold text-3xl text-zinc-950 mt-2">
                ${activePlan === "monthly" ? "19" : "15"}
                <span className="text-xs font-normal text-zinc-500"> / month</span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Single terminal register for boutiques and local shops.
              </p>

              <ul className="space-y-2.5 mt-6 text-xs text-zinc-700">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1 Active POS Register</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Up to 1,000 Product SKUs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Thermal Receipt &amp; PDF Printing</span>
                </li>
              </ul>
            </div>

            <Link
              href="/login"
              className="mt-8 w-full py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-900 text-center transition-colors block"
            >
              Get Started
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-3xl p-7 border-2 border-[#6366F1] shadow-lg shadow-indigo-500/10 flex flex-col justify-between relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#6366F1] text-white">
              MOST POPULAR
            </span>
            <div>
              <div className="text-sm font-semibold text-zinc-600">Professional Retail</div>
              <div className="font-heading font-extrabold text-3xl text-zinc-950 mt-2">
                ${activePlan === "monthly" ? "49" : "39"}
                <span className="text-xs font-normal text-zinc-500"> / month</span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Multi-terminal stores with barcode scanning &amp; alerts.
              </p>

              <ul className="space-y-2.5 mt-6 text-xs text-zinc-700">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unlimited POS Terminals</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unlimited Inventory SKUs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Real-Time Low Stock Alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Automated Profit &amp; Loss Statements</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              className="mt-8 w-full py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-xs font-semibold text-white text-center shadow-md shadow-indigo-500/20 transition-all block"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-3xl p-7 border border-zinc-200/70 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-600">Multi-Chain Enterprise</div>
              <div className="font-heading font-extrabold text-3xl text-zinc-950 mt-2">
                ${activePlan === "monthly" ? "129" : "99"}
                <span className="text-xs font-normal text-zinc-500"> / month</span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Full warehouse supply chain &amp; custom branch permissions.
              </p>

              <ul className="space-y-2.5 mt-6 text-xs text-zinc-700">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Multi-Warehouse Transfers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Granular Role-Based Permissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dedicated Support &amp; API Access</span>
                </li>
              </ul>
            </div>

            <Link
              href="/login"
              className="mt-8 w-full py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-900 text-center transition-colors block"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold">
              NG
            </div>
            <span className="font-heading font-bold text-sm text-[#161628]">
              NextGen Cloud POS
            </span>
          </div>

          <div className="text-xs text-[#7D7D93]">
            &copy; {new Date().getFullYear()} NextGen Cloud POS. Built for high-velocity modern commerce.
          </div>

          <div className="flex items-center gap-5 text-xs font-medium text-[#55556E]">
            <Link href="/dashboard" className="hover:text-zinc-950 transition-colors">
              Dashboard
            </Link>
            <Link href="/pos" className="hover:text-zinc-950 transition-colors">
              POS Terminal
            </Link>
            <Link href="/login" className="hover:text-zinc-950 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
