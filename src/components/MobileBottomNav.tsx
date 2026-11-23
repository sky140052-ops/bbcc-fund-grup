"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  IndianRupee,
  LayoutDashboard,
  FileText,
  ShieldAlert,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  // If on admin page, dashboard button points to admin
  const isAdminSection = pathname.startsWith("/admin");

  const navItems = [
    {
      label: "होम",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "पे / ₹100",
      href: "/pay",
      icon: Wallet,
      isActive: pathname === "/pay",
      badge: "₹100",
    },
    {
      label: "लोन",
      href: "/loan-apply",
      icon: IndianRupee,
      isActive: pathname === "/loan-apply",
      highlight: true,
    },
    {
      label: isAdminSection ? "एडमिन" : "डैशबोर्ड",
      href: isAdminSection ? "/admin" : "/dashboard",
      icon: isAdminSection ? ShieldAlert : LayoutDashboard,
      isActive: pathname === "/dashboard" || pathname.startsWith("/admin"),
    },
    {
      label: "नियम",
      href: "/rules",
      icon: FileText,
      isActive: pathname === "/rules",
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-1.5 transition-all duration-200 select-none"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 group relative ${
                active
                  ? "text-blue-600 font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <div className="relative flex items-center justify-center">
                {/* Active glow / background pill */}
                {active && (
                  <span className="absolute -inset-1.5 bg-blue-50/90 rounded-xl -z-10 animate-scale-in" />
                )}

                {/* Badge if available */}
                {item.badge && !active && (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[9px] font-black px-1 rounded-full leading-tight shadow-sm">
                    {item.badge}
                  </span>
                )}

                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    active ? "scale-110 stroke-[2.4]" : "stroke-[1.8] group-hover:scale-105"
                  }`}
                />
              </div>

              <span
                className={`text-[10px] mt-1 tracking-tight text-center truncate max-w-full ${
                  active ? "text-blue-600 font-bold" : "text-slate-500"
                }`}
              >
                {item.label}
              </span>

              {/* Active top dot indicator */}
              {active && (
                <span className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
