"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, Phone, ArrowRight, Info, BookOpen, CheckCircle2 } from "lucide-react";

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
            सुरक्षित एवं एन्क्रिप्टेड लॉगिन पोर्टल (Bank-Grade Security)
          </p>

          <Link
            href="/rules"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 underline font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ग्रुप के आधिकारिक नियम व शर्तें पढ़ें</span>
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
                मोबाइल नंबर / आधार नंबर
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="अपना मोबाइल नंबर या आधार दर्ज करें"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                जन्मतिथि (DOB) / पासवर्ड
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="जन्मतिथि (उदा. 01011995) या पासवर्ड"
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
              <span>{loading ? "सत्यापित हो रहा है..." : "सुरक्षित लॉगिन करें (Sign In)"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Badge */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit SSL एन्क्रिप्टेड • DataStax Astra DB सुरक्षित</span>
          </div>
        </div>
      </div>
    </div>
  );
}
