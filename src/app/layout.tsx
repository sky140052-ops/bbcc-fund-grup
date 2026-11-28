import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import Navbar from "../components/Navbar";
import MobileBottomNav from "../components/MobileBottomNav";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";
import { ShieldCheck, MapPin, Phone, Mail, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "DFI - इमरजेंसी सेवा ग्रुप (Digital Financial Infrastructure)",
  description: "DFI सुरक्षित सदस्य बचत, आकस्मिक लोन, आधार व पैन सत्यापन एवं पारदर्शी वित्तीय पोर्टल",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DFI ऐप",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="DFI ऐप" />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
        <ServiceWorkerRegistration />
        <Navbar />

        <main className="flex-1 pb-24 sm:pb-0">{children}</main>

        {/* ========================================================
            COMPREHENSIVE COMPLIANT FOOTER (PHONEPE & RBI COMPLIANT)
            ======================================================== */}
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-8 pb-20 sm:pb-8 text-xs select-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            
            {/* Top Row: Business Identity & Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800">
              
              {/* Col 1: About Business */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <span>DFI इमरजेंसी सेवा ग्रुप (BBCC Fund)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  पारस्परिक कम्युनिटी बचत, 100% पारदर्शी खाता बही तथा 1% प्रतिमाह ब्याज पर आपातकालीन वित्तीय सहायता उपलब्ध कराने वाला पंजीकृत सदस्य पोर्टल।
                </p>
                <div className="pt-1 flex items-center gap-2 text-[10px] text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>256-Bit SSL सुरक्षित • PhonePe व UPI अधिकृत</span>
                </div>
              </div>

              {/* Col 2: Physical Postal Address (Mandatory for PhonePe) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>पंजीकृत डाक पता (Postal Address)</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed font-medium bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <p className="text-white font-semibold">DFI इमरजेंसी सेवा ग्रुप</p>
                  <p>ग्राम व पोस्ट: दहिला (Dahila), परजुआर (Parjuar)</p>
                  <p>थाना: अरेर (Arer), ज़िला: मधुबनी</p>
                  <p>बिहार (Bihar) - 847229, भारत</p>
                </div>
              </div>

              {/* Col 3: Direct Phone & Email */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-wider">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>हेल्पलाइन एवं संपर्क (Helpline)</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">फ़ोन / WhatsApp:</span>
                    <a
                      href="tel:+917543952488"
                      className="text-emerald-400 font-mono font-bold hover:underline"
                    >
                      +91 7543952488
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">आधिकारिक ईमेल:</span>
                    <a
                      href="mailto:sky140052@gmail.com"
                      className="text-blue-400 font-mono font-bold hover:underline"
                    >
                      sky140052@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>समय:</span>
                    <span className="text-slate-300">सोम - शनि (09:00 AM - 07:00 PM)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Row: Mandatory Policy Links & Copyright */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              
              {/* Policy Links */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-400">
                <Link href="/contact" className="hover:text-white transition">
                  संपर्क करें (Contact Us)
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-white transition">
                  नियम व शर्तें (Terms & Conditions)
                </Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-white transition">
                  गोपनीयता नीति (Privacy Policy)
                </Link>
                <span>•</span>
                <Link href="/refund" className="hover:text-white transition">
                  रिफंड नीति (Refund Policy)
                </Link>
                <span>•</span>
                <Link href="/rules" className="hover:text-white transition">
                  फंड नियम (Rules)
                </Link>
              </div>

              {/* Copyright */}
              <p className="text-[11px] text-slate-400 shrink-0">
                © 2026 DFI इमरजेंसी सेवा ग्रुप. सर्वाधिकार सुरक्षित।
              </p>
            </div>

          </div>
        </footer>

        {/* Native Mobile App Bottom Navigation Bar */}
        <MobileBottomNav />
      </body>
    </html>
  );
}
