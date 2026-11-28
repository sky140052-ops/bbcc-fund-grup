"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Settings, ShieldCheck, Sliders, LogOut } from "lucide-react";
import AppDrawer from "./AppDrawer";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [linkActive, setLinkActive] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const isAdminRoute = pathname.startsWith("/admin");
  const isUserAdmin = user && (user.role === "admin" || user.role === "founder");

  // 1. ADMIN MODE TOP BAR (Streamlined & Clean)
  if (isAdminRoute) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            {/* Left: Menu Bar Trigger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition active:scale-90"
              aria-label="मेनू खोलें"
              title="मेन्यू"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Center: DFI Logo & Brand */}
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-sm font-black text-sm tracking-wider flex-shrink-0">
                DFI
              </div>
              <div className="text-center">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  DFI एडमिन कंसोल
                </span>
              </div>
            </Link>

            {/* Right: Quick Action / Settings Cog */}
            <div className="flex items-center gap-1.5">
              <Link
                href="/admin?tab=status"
                className="p-2 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition active:scale-90"
                title="सिस्टम सेटिंग्स"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Slide-out Left Drawer */}
        <AppDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          handleLogout={handleLogout}
          linkActive={linkActive}
        />
      </>
    );
  }

  // 2. MEMBER / PUBLIC HEADER (Native App Top Bar matching Reference Screenshot Slide 1)
  // Left: Hamburger Menu | Center: DFI Logo & Name | Right: Settings Gear
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Left: Slide-out Drawer Hamburger Menu button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-1 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition active:scale-90"
            aria-label="मेनू खोलें"
            title="मेन्यू बार"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>

          {/* Center: DFI Logo and Name (Clean, minimal, centered) */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-sm sm:text-base tracking-wider flex-shrink-0">
              DFI
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  DFI इमरजेंसी सेवा
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </Link>

          {/* Right: Settings Cog icon or Profile (matching Slide 1 gear icon) */}
          <div className="flex items-center gap-1">
            {isUserAdmin ? (
              <Link
                href="/admin"
                className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition active:scale-90"
                title="एडमिन मोड"
              >
                <Sliders className="w-5 h-5 stroke-[2.2]" />
              </Link>
            ) : user ? (
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition active:scale-90 flex items-center gap-1"
                title="सेटिंग्स एवं प्रोफाइल"
              >
                <Settings className="w-5 h-5 text-slate-600 hover:text-blue-600 stroke-[2.2]" />
              </button>
            ) : (
              <Link
                href="/?open_login=true"
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition active:scale-90"
                title="लॉगिन"
              >
                <Settings className="w-5 h-5 stroke-[2.2]" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out Left Drawer */}
      <AppDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        handleLogout={handleLogout}
        linkActive={linkActive}
      />
    </>
  );
}
