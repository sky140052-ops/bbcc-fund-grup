"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Home, UserPlus, LogOut, UserCheck } from "lucide-react";
import InstallAppButton from "./InstallAppButton";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [linkActive, setLinkActive] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // 1. Check Session State (via cookies & localStorage Bearer token)
    async function checkAuth() {
      try {
        const localToken = typeof window !== "undefined" ? localStorage.getItem("dfi_token") : null;
        const headers: Record<string, string> = {};
        if (localToken) headers["Authorization"] = `Bearer ${localToken}`;

        const res = await fetch("/api/auth/me", { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch {
        // Not authenticated
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    }

    // 2. Check System Settings (Registration Link Active)
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.settings) {
            setLinkActive(Boolean(data.settings.registration_link_active));
          }
        }
      } catch {
        // Default to false
      }
    }

    checkAuth();
    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("dfi_token");
        localStorage.removeItem("dfi_user_email");
      }
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      window.location.reload();
    } catch {
      router.push("/");
    }
  };

  const getDashboardHref = () => {
    if (!user) return "/?open_login=true";
    if (user.role === "admin" || user.role === "founder") return "/admin";
    return "/dashboard";
  };

  const isAdminRoute = pathname.startsWith("/admin");
  const isUserAdmin = user && (user.role === "admin" || user.role === "founder");

  // 1. ADMIN MODE HEADER (Ultra-Professional Command Center)
  if (isAdminRoute || (isUserAdmin && pathname === "/admin")) {
    return (
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Admin Brand / Command Logo */}
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 font-black text-lg sm:text-xl tracking-wider flex-shrink-0">
              DFI
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  DFI एडमिन कंसोल
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ● मास्टर कंट्रोल
                </span>
              </div>
              <span className="block text-[10px] sm:text-[11px] font-semibold text-slate-400 tracking-wide">
                आपातकालीन सेवा प्रबंधन एवं स्वीकृति
              </span>
            </div>
          </Link>

          {/* Admin Navigation & User Actions */}
          <nav className="flex items-center gap-2 sm:gap-3">
            {/* Switch to Member App View */}
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-sm transition active:scale-95"
              title="सदस्य ऐप इंटरफ़ेस देखें"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">सदस्य ऐप दृश्य</span>
              <span className="sm:hidden">सदस्य ऐप</span>
            </Link>

            {/* Admin Badge */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 text-[10px] sm:text-[11px] font-bold border border-amber-500/30 max-w-[120px] truncate">
                <span>👑 मुख्य एडमिन</span>
              </span>

              <button
                onClick={handleLogout}
                title="एडमिन लॉगआउट करें"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>
    );
  }

  // 2. MEMBER MODE & PUBLIC HEADER (Native Android Fintech App Bar)
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-lg sm:text-xl tracking-wider flex-shrink-0">
            DFI
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                DFI
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ● लाइव
              </span>
            </div>
            <span className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wide truncate max-w-[140px] sm:max-w-none">
              इमरजेंसी सेवा ग्रुप
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center gap-1.5 sm:gap-3">
          {/* Join link: ONLY visible when Admin has activated registration */}
          {linkActive && (
            <Link
              href="/join"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>स्वयं जुड़ें (Join)</span>
            </Link>
          )}

          {/* App Install Button: Automatically hidden if inside native Android app / PWA mode */}
          <InstallAppButton variant="pill" />

          {/* Home Link - Desktop Only */}
          <Link
            href="/"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition ${
              pathname === "/"
                ? "bg-slate-100 text-blue-600 font-bold"
                : "text-slate-700 hover:text-blue-600 hover:bg-slate-100"
            }`}
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>होम</span>
          </Link>

          {/* If Admin is viewing Member App, show button to jump back to Admin Console */}
          {isUserAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-amber-300 font-bold text-xs shadow-sm hover:bg-slate-800 transition active:scale-95"
            >
              <span>⚙️ एडमिन मोड</span>
            </Link>
          )}

          {/* Dashboard Button - Desktop Only */}
          {!isUserAdmin && (
            <Link
              href={getDashboardHref()}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/30 transition active:scale-95"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>डैशबोर्ड</span>
            </Link>
          )}

          {/* Login Button on Mobile when not logged in */}
          {!user && !loadingUser && (
            <Link
              href="/?open_login=true"
              className="flex sm:hidden items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition active:scale-95"
            >
              <span>लॉगिन</span>
            </Link>
          )}

          {/* Member Profile Avatar & Logout */}
          {user && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200 max-w-[120px] truncate">
                <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
                  {user.name?.charAt(0) || "U"}
                </span>
                <span className="truncate">{user.name?.split(" ")[0] || "सदस्य"}</span>
              </span>

              <button
                onClick={handleLogout}
                title="लॉगआउट करें"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
