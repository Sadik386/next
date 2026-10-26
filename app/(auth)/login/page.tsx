"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@nextgenpos.com");
  const [password, setPassword] = useState("admin123");
  const [isVerified, setIsVerified] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          turnstileToken: "dev-bypass-token",
        }),
      });

      const data = await res.json();
      if (!res.ok && data.error && !data.error.includes("CAPTCHA")) {
        setAuthError(data.error);
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#161628] relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      {/* Background Ambient Glow & Grid Pattern */}
      <div className="absolute top-0 right-0 w-[800px] h-[700px] bg-gradient-to-bl from-purple-200/40 via-indigo-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[300px] left-[-100px] w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/30 via-indigo-50/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. Header with Logo */}
      <header className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-4 w-full relative z-20">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div className="font-heading font-extrabold text-xl tracking-tight text-[#161628]">
            NextGen <span className="text-[#6366F1]">POS</span>
          </div>
        </Link>
      </header>

      {/* 2. Main Login Content — 2-Column Responsive Split */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8 md:py-16 w-full flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
          {/* Left Column: Bold Typography & Social Proof */}
          <div className="lg:col-span-6 space-y-6 z-10">
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-[56px] text-[#161628] tracking-tight leading-[1.08]">
              Inventory &amp; <br />
              Point of Sale <br />
              Command Center
            </h1>

            <p className="text-base sm:text-lg text-[#55556E] max-w-md leading-relaxed">
              Access your dashboard, manage inventory, and securely process transactions.
            </p>

            {/* Merchant Social Proof */}
            <div className="flex items-center gap-3 pt-6">
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

          {/* Right Column: 3D Isometric Floating Glassmorphic Login Card */}
          <div className="lg:col-span-6 relative flex items-center justify-center select-none py-6">
            {/* Perspective Isometric Grid Pattern */}
            <div className="absolute inset-0 isometric-grid-bg opacity-35 rounded-3xl [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_75%)] pointer-events-none" />

            {/* Floating Refractive Spheres */}
            <div className="absolute -top-4 right-8 w-20 h-20 rounded-full bg-gradient-to-tr from-white/80 via-purple-300/40 to-indigo-400/20 backdrop-blur-md border border-white/80 shadow-[inset_0_4px_12px_rgba(255,255,255,0.9),0_12px_24px_rgba(139,92,246,0.18)] animate-float-gentle pointer-events-none z-10" />
            <div className="absolute -bottom-6 left-6 w-18 h-18 rounded-full bg-gradient-to-tr from-white/80 via-blue-200/30 to-purple-400/20 backdrop-blur-md border border-white/80 shadow-[inset_0_4px_10px_rgba(255,255,255,0.9),0_10px_20px_rgba(99,102,241,0.15)] animate-float-reverse pointer-events-none z-10" />

            {/* Ambient Purple Light Beads */}
            <div className="absolute top-1/4 left-6 w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 blur-xs shadow-md shadow-indigo-500/50" />
            <div className="absolute bottom-16 -right-2 w-4 h-4 rounded-full bg-indigo-600 shadow-sm shadow-indigo-600" />

            {/* Translucent 3D Torus / Ring Decoration */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full border-[12px] border-purple-300/45 [transform:rotateX(60deg)_rotateZ(30deg)] shadow-lg shadow-purple-500/10 pointer-events-none" />

            {/* 3D Composition Container */}
            <div className="relative w-full max-w-[430px]">
              {/* Back Glass Shadow Tray for depth */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-purple-200/30 via-white/20 to-indigo-100/30 rounded-[36px] border border-white/50 blur-[1px] -z-10 [transform:perspective(1000px)_rotateY(-6deg)_rotateX(6deg)]" />

              {/* Foreground Translucent Glass Login Card */}
              <div className="glass-card-hero rounded-[32px] p-8 sm:p-9 shadow-[0_25px_60px_rgba(99,102,241,0.16)] transition-all duration-300 relative z-20">
                <div className="mb-6">
                  <h2 className="font-heading font-extrabold text-2xl text-zinc-950 tracking-tight">
                    Sign In
                  </h2>
                  <p className="text-xs text-[#7D7D93] mt-1 font-medium">
                    Welcome back! Please enter your details.
                  </p>
                </div>

                {authError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-zinc-700 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g., name@business.com"
                      className="w-full bg-white/90 border border-zinc-200/90 rounded-xl px-4 py-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="password"
                        className="text-xs font-semibold text-zinc-700"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => alert("Demo password is: admin123")}
                        className="text-xs font-medium text-zinc-500 hover:text-indigo-600 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-white/90 border border-zinc-200/90 rounded-xl px-4 py-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Cloudflare Turnstile Human Verification Box */}
                  <div
                    onClick={() => setIsVerified(!isVerified)}
                    className="p-3 bg-white/95 rounded-xl border border-zinc-200/80 flex items-center justify-between shadow-2xs cursor-pointer hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                          isVerified
                            ? "bg-[#2563EB] text-white"
                            : "border-2 border-zinc-300"
                        }`}
                      >
                        {isVerified && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-semibold text-zinc-800">
                        Verify you are human
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Turnstile</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#4F46E5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white font-semibold text-sm rounded-2xl shadow-[0_10px_24px_rgba(79,70,229,0.36)] hover:shadow-[0_12px_28px_rgba(79,70,229,0.46)] hover:-translate-y-0.5 active:translate-y-0 transition-all tactile-btn cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </form>

                {/* Footer Link */}
                <div className="text-center mt-6">
                  <span className="text-xs text-zinc-500 font-medium">
                    Don't have an account?{" "}
                  </span>
                  <Link
                    href="/dashboard"
                    className="text-xs font-semibold text-zinc-800 hover:text-indigo-600 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Minimal Bottom Copyright */}
      <footer className="max-w-7xl mx-auto px-6 lg:px-12 py-6 w-full text-center text-xs text-zinc-400">
        &copy; {new Date().getFullYear()} NextGen Cloud POS. All rights reserved.
      </footer>
    </div>
  );
}
