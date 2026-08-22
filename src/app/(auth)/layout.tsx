import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { AuthHeroSlideshow } from "@/components/auth/auth-hero-slideshow";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#273338] text-white selection:bg-[#0B3B36] selection:text-white overflow-x-hidden">
      {/* ── 1. Same Hero Slideshow Background As Home Page ── */}
      <AuthHeroSlideshow />

      {/* ── 2. Top Header Navigation Bar ── */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-3 font-heading text-lg font-bold text-white transition-transform hover:scale-[1.01]"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#0B3B36] text-white border border-[#9CB080]/30 shadow-lg shadow-black/30 group-hover:bg-[#0D4D46] transition-all">
            <Stethoscope className="size-5 text-[#9CB080]" />
          </span>
          <div className="flex flex-col">
            <span className="leading-tight tracking-wide font-extrabold text-white">CLINIC CARE</span>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#9CB080]">DENTAL PRACTICE</span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 backdrop-blur-xl px-4 py-2 text-xs font-bold text-white hover:bg-white/20 hover:border-white/40 transition-all shadow-xl cursor-pointer"
        >
          <ArrowLeft className="size-3.5 text-[#9CB080]" />
          <span>Back to website</span>
        </Link>
      </header>

      {/* ── 3. Main Hero Center Container (Sign In Box) ── */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-20">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
