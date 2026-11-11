import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Shield, BookOpen, User, LogOut } from "lucide-react";

export const metadata: Metadata = {
  title: "BBCC Fund Grup - Community Savings & Chit Platform",
  description: "Secure, Transparent Community Fund & Bishi Management Platform with Astra DB & Razorpay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold text-lg">
                BB
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                  BBCC FUND GRUP
                </span>
                <span className="block text-xs font-semibold text-emerald-600 tracking-wide">
                  पारदर्शी बचत एवं सहयोग समिति
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/rules"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
              >
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>नियम व शर्तें (Rules)</span>
              </Link>

              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <p className="font-medium text-slate-700">
              © 2026 BBCC Fund Grup. सर्वाधिकार सुरक्षित (All Rights Reserved).
            </p>
            <p className="mt-1 text-slate-400">
              Astra DB Serverless & Razorpay Verified Gateway • 100% पारदर्शी बचत समूह
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
