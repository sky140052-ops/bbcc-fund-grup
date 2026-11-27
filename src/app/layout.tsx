import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import MobileBottomNav from "../components/MobileBottomNav";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";
import { ShieldCheck } from "lucide-react";

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

        <main className="flex-1 pb-20 sm:pb-0">{children}</main>

        {/* Website Footer: Hidden on mobile phones to give clean 100% native app feel above bottom nav */}
        <footer className="hidden sm:block bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
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

        {/* Native Mobile App Bottom Navigation Bar */}
        <MobileBottomNav />
      </body>
    </html>
  );
}
