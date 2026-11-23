"use client";

import React from "react";
import Link from "next/link";
import InstallAppButton from "../../components/InstallAppButton";
import {
  Smartphone,
  ShieldCheck,
  Zap,
  RefreshCw,
  Lock,
  ArrowRight,
  CheckCircle2,
  Share2,
  PlusSquare,
  Home,
  LayoutDashboard,
} from "lucide-react";

export default function InstallAppPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/20">
              DFI
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                इमरजेंसी सेवा ग्रुप
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Mobile App
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">आधिकारिक मोबाइल ऐप पोर्टल</p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1 transition"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
            <span>डैशबोर्ड</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto w-full px-4 py-8 flex-1 space-y-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-blue-600/30 border-2 border-white/20">
            <Smartphone className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              DFI इमरजेंसी सेवा मोबाइल ऐप
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              अपने मोबाइल की होम स्क्रीन पर एक क्लिक में इनस्टॉल करें। बार-बार लॉगिन की जरूरत नहीं, ऐप खोलते ही सीधे आपका डैशबोर्ड खुलेगा!
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 max-w-sm mx-auto">
            <InstallAppButton variant="button" className="w-full text-base py-3.5" />
          </div>

          {/* Key Advantages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-left">
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>स्थायी लॉगिन</span>
              </div>
              <p className="text-[11px] text-slate-400">
                ऐप में कभी ऑटो-लॉगआउट नहीं होगा, हमेशा लॉगिन रहेगा।
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                <RefreshCw className="w-4 h-4" />
                <span>ऑटो-अपडेट</span>
              </div>
              <p className="text-[11px] text-slate-400">
                आगे जो भी नए फीचर जुड़ेंगे, ऐप अपने आप अपडेट हो जाएगी।
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <Zap className="w-4 h-4" />
                <span>सुपर स्मूद व्यू</span>
              </div>
              <p className="text-[11px] text-slate-400">
                नेटिव ऐप की तरह बॉटम नेविगेशन व त्वरित लोडिंग।
              </p>
            </div>
          </div>
        </div>

        {/* How to Install Guide */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>इनस्टॉल करने की आसान विधि (How to Install)</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Android Instructions */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400 block text-sm">
                🤖 एंड्रॉइड (Android / Chrome / Samsung Internet):
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                <li>
                  ऊपर दिए गए <b>"मोबाइल ऐप डाउनलोड / इनस्टॉल करें"</b> बटन पर टैप करें।
                </li>
                <li>
                  स्क्रीन पर <b>"Install app"</b> या <b>"Add to Home screen"</b> का पॉप-अप आएगा।
                </li>
                <li>
                  <b>"Install"</b> पर क्लिक करें। ऐप तुरंत आपके फोन के होम स्क्रीन व ऐप लिस्ट में आ जाएगी!
                </li>
              </ol>
            </div>

            {/* iPhone Instructions */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-blue-400 block text-sm">
                🍎 आईफोन (iPhone / Safari):
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                <li>
                  Safari ब्राउज़र के नीचे <b>Share (शेयर) 📤</b> बटन पर टैप करें।
                </li>
                <li>
                  नीचे स्क्रॉल करके <b>'Add to Home Screen' (होम स्क्रीन पर जोड़ें) ➕</b> चुनें।
                </li>
                <li>
                  ऊपर <b>"Add"</b> पर क्लिक करें। ऐप आपके iPhone पर तैयार हो जाएगी!
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>होम पेज पर जाएं</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-3 py-2 rounded-xl bg-blue-950/40 border border-blue-900/60 transition"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>डैशबोर्ड खोलें</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>© 2026 DFI इमरजेंसी सेवा ग्रुप • आधिकारिक प्रोग्रेसिव वेब एप्लिकेशन (PWA)</p>
      </footer>
    </div>
  );
}
