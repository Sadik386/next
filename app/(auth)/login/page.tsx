"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  CheckCircle2,
  Mail,
  Lock,
  Shield,
  ArrowRight,
  Sparkles,
  Building,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("admin@dokandar.com");
  const [password, setPassword] = useState("••••••••");
  const [twoFa, setTwoFa] = useState("892-104");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Left Column: Brand Hero & Value Proposition */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 p-12 flex-col justify-between relative overflow-hidden text-white">
        {/* Ambient Blurred Background Highlights */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group inline-flex">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
              <Layers className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-2xl tracking-tight text-white block">
                DokanDar
              </span>
              <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase block">
                Commerce OS
              </span>
            </div>
          </Link>

          {/* Heading */}
          <div className="space-y-3 max-w-md pt-4">
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white leading-tight">
              Next-Gen Commerce Operating System
            </h1>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Empowering high-growth retailers and wholesalers with real-time sync, multi-terminal POS, and AI demand forecasting.
            </p>
          </div>

          {/* Value Props */}
          <ul className="space-y-4 pt-4">
            <li className="flex items-center gap-3 text-sm text-indigo-100 font-medium">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>AI-Powered Autonomous Inventory &amp; Restock Alerts</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-indigo-100 font-medium">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Sub-Second Multi-Terminal Real-Time Register Sync</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-indigo-100 font-medium">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Automated Financial P&amp;L Statements &amp; Tax Exports</span>
            </li>
          </ul>
        </div>

        {/* Testimonial Quote Glass Card */}
        <div className="relative z-10 glass-panel bg-white/10 border-white/20 rounded-2xl p-6 max-w-md shadow-2xl backdrop-blur-md">
          <p className="text-xs sm:text-sm text-indigo-50 italic mb-4 leading-relaxed">
            &ldquo;DokanDar streamlined our multi-branch inventory and POS in under a week. The data precision and speed are unmatched.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
              SK
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Sarah Khan</div>
              <div className="text-[11px] text-indigo-300">Operations Director, Apex Retail</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
          {/* Tenant Domain Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-slate-600 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>apex-retail.dokandar.com</span>
            </div>
          </div>

          {/* Form Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "signin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Register Business
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    defaultValue="Apex Retail International Ltd"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">
                  Password
                </label>
                <a href="#" className="text-[11px] font-medium text-indigo-600 hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* 2FA Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                2FA Hardware Authenticator / OTP
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={twoFa}
                  onChange={(e) => setTwoFa(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember"
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 cursor-pointer">
                Trust &amp; remember this terminal for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>Authenticating Terminal...</span>
              ) : (
                <>
                  <span>
                    {activeTab === "signin"
                      ? "Authenticate Terminal & Enter"
                      : "Create Commerce Tenant"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Fast Demo Quick Switch */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">
              Demo Terminal Quick Selection
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@dokandar.com");
                  setPassword("admin123");
                }}
                className="flex-1 py-1 px-2 text-[11px] font-medium bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
              >
                Store Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("cashier@dokandar.com");
                  setPassword("cashier123");
                }}
                className="flex-1 py-1 px-2 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 transition-colors"
              >
                POS Cashier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
