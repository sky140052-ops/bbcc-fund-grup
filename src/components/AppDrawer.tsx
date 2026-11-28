"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  X,
  Home,
  LayoutDashboard,
  Wallet,
  IndianRupee,
  Users,
  UserPlus,
  HelpCircle,
  Mail,
  PhoneCall,
  Share2,
  FileText,
  ShieldCheck,
  LogOut,
  LogIn,
  Sliders,
  CheckCircle2,
  Database,
  Star,
  Info,
} from "lucide-react";

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  handleLogout: () => void;
  linkActive?: boolean;
}

export default function AppDrawer({
  isOpen,
  onClose,
  user,
  handleLogout,
  linkActive = false,
}: AppDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [copiedLink, setCopiedLink] = useState(false);

  // Close drawer on path change
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Share App
  const handleShareApp = async () => {
    const shareData = {
      title: "DFI - इमरजेंसी सेवा ग्रुप",
      text: "DFI सुरक्षित सदस्य बचत, 90% आकस्मिक लोन एवं पारदर्शी वित्तीय पोर्टल में शामिल हों।",
      url: typeof window !== "undefined" ? window.location.origin : "https://bbcc-fund-grup.onrender.com",
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareData.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const isAdmin = user && (user.role === "admin" || user.role === "founder");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 1. Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />

      {/* 2. Slide-out Left Menu Panel (Deep Cobalt Blue matching reference image Slide 3) */}
      <div className="relative w-80 max-w-[85vw] h-full bg-gradient-to-b from-blue-700 via-blue-600 to-indigo-800 text-white shadow-2xl flex flex-col z-10 animate-slide-right overflow-hidden">
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-90"
          aria-label="मेनू बंद करें"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 3. User Profile Card Header (Slide 3 reference: circular white avatar + Name + phone) */}
        <div className="pt-8 pb-6 px-6 border-b border-white/15">
          <div className="flex items-center gap-4">
            {/* White Circular Avatar */}
            {user?.photo ? (
              <img
                src={user.photo}
                alt={user.name || "User"}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white text-blue-700 flex items-center justify-center font-black text-2xl shadow-lg flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : "👤"}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-tight text-white truncate">
                {user?.name || "DFI अतिथि सदस्य"}
              </h2>
              <p className="text-xs text-blue-100 font-medium truncate">
                {user?.mobile ? `+91 ${user.mobile}` : user?.email || "आपातकालीन वित्तीय सेवा"}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  {isAdmin ? "👑 मुख्य एडमिन" : user ? "सत्यापित सदस्य" : "अतिथि (Guest)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Scrollable Drawer Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/20">
          {/* Main Services Navigation */}
          <div>
            <span className="px-3 text-[11px] font-black tracking-wider uppercase text-blue-200 block mb-2">
              मुख्य सेवाएं (Services)
            </span>
            <div className="space-y-1">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-200" />
                <span>सदस्य डैशबोर्ड</span>
              </Link>

              <Link
                href="/pay"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98"
              >
                <Wallet className="w-4 h-4 text-emerald-300" />
                <span>मासिक बचत पे करें (Direct UPI)</span>
              </Link>

              <Link
                href="/dashboard?tab=loan"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98"
              >
                <IndianRupee className="w-4 h-4 text-amber-300" />
                <span>आकस्मिक लोन आवेदन (90%)</span>
              </Link>

              <Link
                href="/dashboard?tab=transparency"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98"
              >
                <Users className="w-4 h-4 text-sky-200" />
                <span>समुदाय फंड व पारदर्शिता</span>
              </Link>

              {linkActive && (
                <Link
                  href="/join"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98"
                >
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <span>नया सदस्य पंजीकरण लिंक</span>
                </Link>
              )}
            </div>
          </div>

          {/* Admin Management Section (If admin/founder) */}
          {isAdmin && (
            <div>
              <span className="px-3 text-[11px] font-black tracking-wider uppercase text-amber-300 block mb-2">
                एडमिन मास्टर कंट्रोल (Admin)
              </span>
              <div className="space-y-1">
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-sm font-bold border border-amber-400/30 transition active:scale-98"
                >
                  <Sliders className="w-4 h-4 text-amber-300" />
                  <span>एडमिन कमांड कंसोल</span>
                </Link>

                <Link
                  href="/admin?tab=transactions"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>जमा व लोन स्वीकृतियां</span>
                </Link>

                <Link
                  href="/admin?tab=members"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98"
                >
                  <Users className="w-4 h-4 text-blue-200" />
                  <span>सदस्य डायरेक्टरी व KYC</span>
                </Link>

                <Link
                  href="/admin?tab=status"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98"
                >
                  <Database className="w-4 h-4 text-rose-300" />
                  <span>डेटाबेस बैकअप व रीसेट</span>
                </Link>
              </div>
            </div>
          )}

          {/* Help Section (Slide 3 reference: FAQs, Send E-mail, Call) */}
          <div>
            <span className="px-3 text-[11px] font-black tracking-wider uppercase text-blue-200 block mb-2">
              सहायता एवं सपोर्ट (Help)
            </span>
            <div className="space-y-1">
              <Link
                href="/contact"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98"
              >
                <HelpCircle className="w-4 h-4 text-blue-200" />
                <span>संपर्क करें (Contact & Office)</span>
              </Link>

              <a
                href="mailto:sky140052@gmail.com?subject=DFI%20Help%20Support"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98"
              >
                <Mail className="w-4 h-4 text-blue-200" />
                <span>ईमेल सहायता (sky140052@gmail.com)</span>
              </a>

              <a
                href="https://wa.me/917543952488?text=नमस्ते%20DFI%20इमरजेंसी%20हेल्पलाइन"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98"
              >
                <PhoneCall className="w-4 h-4 text-emerald-300" />
                <span>कॉल व WhatsApp (+91 7543952488)</span>
              </a>
            </div>
          </div>

          {/* Apps / Info Section (Slide 3 reference: Share app, Rate us, About, Policy) */}
          <div>
            <span className="px-3 text-[11px] font-black tracking-wider uppercase text-blue-200 block mb-2">
              ऐप जानकारी (Apps)
            </span>
            <div className="space-y-1">
              <button
                onClick={handleShareApp}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition active:scale-98 text-left"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-blue-200" />
                  <span>ऐप शेयर करें (Share App)</span>
                </div>
                {copiedLink && (
                  <span className="text-[10px] bg-emerald-400 text-slate-900 px-2 py-0.5 rounded-full font-bold">
                    कॉपी हुआ!
                  </span>
                )}
              </button>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/15 text-white text-sm font-semibold transition">
                <Star className="w-4 h-4 text-amber-300" />
                <span>ऐप रेटिंग: 4.9 ★★★★★</span>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1">
                <Link
                  href="/terms"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-white/15 text-blue-100 text-xs font-semibold transition"
                >
                  <span>• नियम व शर्तें (Terms & Conditions)</span>
                </Link>
                <Link
                  href="/privacy"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-white/15 text-blue-100 text-xs font-semibold transition"
                >
                  <span>• गोपनीयता नीति (Privacy Policy)</span>
                </Link>
                <Link
                  href="/refund"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-white/15 text-blue-100 text-xs font-semibold transition"
                >
                  <span>• रिफंड नीति (Refund Policy)</span>
                </Link>
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-blue-100 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>सुरक्षित 256-bit SSL • PhonePe अधिकृत</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Sticky Bottom Action (Logout or Login) */}
        <div className="p-4 border-t border-white/15 bg-blue-800/50 backdrop-blur-md">
          {user ? (
            <button
              onClick={() => {
                onClose();
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-white/15 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-md active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>लॉगआउट (Log out)</span>
            </button>
          ) : (
            <Link
              href="/?open_login=true"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-sm transition-all shadow-md active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              <span>लॉगिन करें (Sign In)</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
