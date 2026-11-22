import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { ShieldCheck, UserCheck, LayoutDashboard, Home, UserPlus } from "lucide-react";

export const metadata: Metadata = {
  title: "DFI - इमरजेंसी सेवा ग्रुप (Digital Financial Infrastructure)",
  description: "DFI सुरक्षित सदस्य बचत, आकस्मिक लोन, आधार व पैन सत्यापन एवं पारदर्शी वित्तीय पोर्टल",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DFI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" className="scroll-smooth">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-xl tracking-wider">
                DFI
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  DFI
                </span>
                <span className="block text-[11px] font-semibold text-emerald-600 tracking-wide">
                  इमरजेंसी सेवा ग्रुप
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/join"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
              >
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>स्वयं जुड़ें (Join)</span>
              </Link>

              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>होम</span>
              </Link>

              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/30 transition active:scale-95"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>एडमिन</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 mb-1 text-slate-700 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>DFI - Digital Financial Infrastructure</span>
            </div>
            <p className="mt-1 text-slate-400">
              सुरक्षित सदस्य प्रबंधन • 100% पारदर्शी बचत • Brevo API एवं Razorpay सुरक्षित प्रमाणीकरण
            </p>
            <p className="mt-1 text-slate-400">
              © 2026 DFI इमरजेंसी सेवा ग्रुप. सर्वाधिकार सुरक्षित।
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
