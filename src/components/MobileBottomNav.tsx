"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  Wallet,
  IndianRupee,
  LayoutDashboard,
  FileText,
  ShieldAlert,
  CreditCard,
  User,
  Users,
  Sparkles,
} from "lucide-react";

function MobileBottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isDashboard = pathname === "/dashboard";
  const isAdmin = pathname.startsWith("/admin");
  const currentTab = searchParams.get("tab") || "my_fund";

  // Dashboard Context Nav Items
  if (isDashboard) {
    const dashboardItems = [
      {
        id: "my_fund",
        label: "बचत",
        href: "/dashboard?tab=my_fund",
        icon: CreditCard,
        isActive: currentTab === "my_fund",
      },
      {
        id: "loan",
        label: "लोन",
        href: "/dashboard?tab=loan",
        icon: IndianRupee,
        isActive: currentTab === "loan",
      },
      {
        id: "pay",
        label: "पे करें",
        href: "/pay",
        icon: Wallet,
        isCenter: true,
        isActive: false,
      },
      {
        id: "transparency",
        label: "समुदाय",
        href: "/dashboard?tab=transparency",
        icon: Users,
        isActive: currentTab === "transparency",
      },
      {
        id: "my_profile",
        label: "प्रोफाइल",
        href: "/dashboard?tab=my_profile",
        icon: User,
        isActive: currentTab === "my_profile",
      },
    ];

    return (
      <nav
        aria-label="Mobile Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-1 select-none"
      >
        <div className="grid grid-cols-5 items-end justify-around max-w-md mx-auto px-1">
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;

            // Elevated Center Pay Button
            if (item.isCenter) {
              return (
                <div key={item.id} className="flex flex-col items-center justify-center -mt-5 relative">
                  <Link
                    href={item.href}
                    className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white shadow-lg shadow-blue-500/35 border-4 border-white flex items-center justify-center transition-all duration-150 active:scale-90 hover:scale-105"
                    title="तुरंत पे करें"
                  >
                    <Wallet className="w-5 h-5 text-white stroke-[2.5]" />
                  </Link>
                  <span className="text-[10px] font-black text-blue-600 tracking-tight mt-1">
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 group relative ${
                  active ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800 font-medium"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {active && (
                    <span className="absolute -inset-1.5 bg-blue-50 rounded-xl -z-10 animate-scale-in" />
                  )}
                  <Icon
                    className={`w-5 h-5 transition-transform duration-150 ${
                      active ? "scale-110 stroke-[2.5] text-blue-600" : "stroke-[1.8] group-hover:scale-105"
                    }`}
                  />
                </div>
                <span className={`text-[10px] mt-1 tracking-tight text-center truncate max-w-full ${
                  active ? "text-blue-600 font-bold" : "text-slate-500"
                }`}>
                  {item.label}
                </span>
                {active && <span className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Global / Other Pages Nav Items
  const globalItems = [
    {
      id: "home",
      label: "होम",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      id: "loan",
      label: "लोन",
      href: "/loan-apply",
      icon: IndianRupee,
      isActive: pathname === "/loan-apply",
    },
    {
      id: "pay",
      label: "पे करें",
      href: "/pay",
      icon: Wallet,
      isCenter: true,
      isActive: pathname === "/pay",
    },
    {
      id: "dashboard",
      label: isAdmin ? "एडमिन" : "डैशबोर्ड",
      href: isAdmin ? "/admin" : "/dashboard",
      icon: isAdmin ? ShieldAlert : LayoutDashboard,
      isActive: pathname === "/dashboard" || pathname.startsWith("/admin"),
    },
    {
      id: "rules",
      label: "नियम",
      href: "/rules",
      icon: FileText,
      isActive: pathname === "/rules",
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-1 select-none"
    >
      <div className="grid grid-cols-5 items-end justify-around max-w-md mx-auto px-1">
        {globalItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          // Elevated Center Pay Button
          if (item.isCenter) {
            return (
              <div key={item.id} className="flex flex-col items-center justify-center -mt-5 relative">
                <Link
                  href={item.href}
                  className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white shadow-lg shadow-blue-500/35 border-4 border-white flex items-center justify-center transition-all duration-150 active:scale-90 hover:scale-105"
                  title="तुरंत पे करें"
                >
                  <Wallet className="w-5 h-5 text-white stroke-[2.5]" />
                </Link>
                <span className="text-[10px] font-black text-blue-600 tracking-tight mt-1">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 group relative ${
                active ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <div className="relative flex items-center justify-center">
                {active && (
                  <span className="absolute -inset-1.5 bg-blue-50 rounded-xl -z-10 animate-scale-in" />
                )}
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    active ? "scale-110 stroke-[2.5] text-blue-600" : "stroke-[1.8] group-hover:scale-105"
                  }`}
                />
              </div>
              <span className={`text-[10px] mt-1 tracking-tight text-center truncate max-w-full ${
                active ? "text-blue-600 font-bold" : "text-slate-500"
              }`}>
                {item.label}
              </span>
              {active && <span className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavContent />
    </Suspense>
  );
}
