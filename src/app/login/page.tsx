"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, Phone, UserCheck, ArrowRight, Info, BookOpen } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, secret }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "लॉगिन असफल रहा। कृपया सही विवरण दर्ज करें।");
        setLoading(false);
        return;
      }

      router.push(data.redirectTo || "/dashboard");
    } catch {
      setError("सर्वर से जुड़ने में समस्या हुई। कृपया दोबारा प्रयास करें।");
      setLoading(false);
    }
  };

  const handleFillDemo = (type: "admin" | "manager" | "client") => {
    if (type === "admin") {
      setIdentifier("649712349707");
      setSecret("09042001");
    } else if (type === "manager") {
      setIdentifier("9876543210");
      setSecret("manager_pass_123");
    } else {
      setIdentifier("9811122233");
      setSecret("01011995");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 p-8 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-3 shadow-inner">
            <Shield className="w-7 h-7 text-sky-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">BBCC FUND GRUP</h2>
          <p className="mt-1 text-xs font-semibold text-slate-300">
            एकल सुरक्षित लॉगिन पोर्टल (Unified Smart Login)
          </p>

          <Link
            href="/rules"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 underline font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ग्रुप के नियम व शर्तें पढ़ें</span>
          </Link>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium rounded-xl flex items-start gap-2">
              <Info className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                मोबाइल नंबर / आधार नंबर / यूज़र आईडी
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="उदा. 9811122233 या 649712349707"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                जन्मतिथि (DOB: DDMMYYYY) / पासवर्ड
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="उदा. 01011995 या पासवर्ड"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold rounded-xl shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 text-sm transition"
            >
              <span>{loading ? "सत्यापित हो रहा है..." : "लॉगिन करें (Sign In)"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2.5">
              तुरंत टेस्ट करने के लिए क्लिक करें:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo("admin")}
                className="p-2 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-center border border-slate-200 transition"
              >
                👑 मुख्य फाउंडर
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("manager")}
                className="p-2 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-center border border-blue-200 transition"
              >
                👔 मैनेजर (MD)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("client")}
                className="p-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-center border border-emerald-200 transition"
              >
                👤 सदस्य (Client)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
