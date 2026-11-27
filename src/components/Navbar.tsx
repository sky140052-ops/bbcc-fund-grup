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

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
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

          {/* App Install Button */}
          <InstallAppButton variant="pill" />

          {/* Home Link - Desktop Only (Mobile uses Bottom Dock) */}
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

          {/* Dashboard Button - Desktop Only */}
          <Link
            href={getDashboardHref()}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/30 transition active:scale-95"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>डैशबोर्ड</span>
          </Link>

          {/* Login Button on Mobile when not logged in */}
          {!user && !loadingUser && (
            <Link
              href="/?open_login=true"
              className="flex sm:hidden items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition active:scale-95"
            >
              <span>लॉगिन</span>
            </Link>
          )}

          {/* User Status / Logout Option if Logged In */}
          {user && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] sm:text-[11px] font-bold border border-emerald-200 max-w-[85px] sm:max-w-[120px] truncate">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
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
