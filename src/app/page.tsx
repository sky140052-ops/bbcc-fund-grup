"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  CreditCard,
  FileCheck,
  Server,
  Zap,
  Eye,
  KeyRound,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("sky140052@gmail.com");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [backupOtp, setBackupOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Check if already logged in as Admin
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && (data.user?.role === "admin" || data.user?.role === "founder")) {
            setIsAdminLoggedIn(true);
          }
        }
      } catch {
        // Not authenticated
      }
    }
    checkAuth();
  }, []);

  // Request Email OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    if (!adminEmail.includes("@")) {
      setErrorMsg("कृपया मान्य ईमेल पता दर्ज करें।");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "OTP भेजने में विफल");
      }

      setOtpSent(true);
      setStatusMsg(data.message || `OTP ईमेल ${adminEmail} पर भेज दिया गया है।`);
      if (data.backup_otp) {
        setBackupOtp(data.backup_otp);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "सर्वर से कनेक्ट करने में त्रुटि।");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    if (otpCode.length < 6) {
      setErrorMsg("कृपया 6-अंकीय OTP दर्ज करें।");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminEmail,
          otp: otpCode,
          remember_me: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "OTP अमान्य है।");
      }

      setStatusMsg("सफलतापूर्वक सत्यापित! एडमिन डैशबोर्ड खोला जा रहा है...");
      setTimeout(() => {
        router.push("/admin");
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || "सत्यापन विफल रहा।");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero & Login Section */}
      <section className="py-12 sm:py-16 px-4 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Branding & Features */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide">
              <Zap className="w-3.5 h-3.5" />
              <span>DFI • DIGITAL FINANCIAL INFRASTRUCTURE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              डिजिटल फंड एवं <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                सुरक्षित सदस्य प्रबंधन
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              DFI एक आधुनिक एवं पूर्ण रूप से सुरक्षित वित्तीय डेटाबेस प्लेटफ़ॉर्म है। यहाँ एडमिन
              अपने सदस्यों की प्रोफाइल, लाइव वेबकैम फोटो, आधार कार्ड (PDF/JPEG), पैन कार्ड
              (PDF/JPEG) और डिजिटल भुगतान विवरण (UPI, बैंक खाता, PhonePe/GPay) को पूर्ण सुरक्षा के
              साथ प्रबंधित कर सकते हैं।
            </p>

            {/* Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">एडमिन लाइव मॉनिटर</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Razorpay लाइव गेटवे व Email OTP स्टेटस की सीधी रियल-टाइम जांच।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">सदस्य KYC व दस्तावेज</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    लाइव कैमरा फोटो, आधार कार्ड व पैन कार्ड दोनों PDF या JPEG में।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">डिजिटल भुगतान विवरण</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    UPI ID, बैंक खाता व IFSC कोड, और PhonePe/GPay नंबर का सुरक्षित रिकॉर्ड।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">त्वरित व्यू, एडिट व डिलीट</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    सदस्यों की सूची में तत्काल सर्च, विवरण दर्शन, संशोधन या स्थायी हटाना।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Admin Login Portal Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -z-10" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 font-black text-xl">
                  DFI
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">एडमिन लॉगिन गेटवे</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Email OTP आधारित सुरक्षित प्रमाणीकरण
                  </p>
                </div>
              </div>

              {/* Already Logged In Banner */}
              {isAdminLoggedIn ? (
                <div className="space-y-4 py-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">सत्यापित एडमिन सत्र सक्रिय है!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        आप पहले से मुख्य एडमिन के रूप में लॉग इन हैं।
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/admin"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
                  >
                    <span>एडमिन डैशबोर्ड पर जाएं</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              ) : (
                /* Login Form */
                <div className="space-y-5">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  {statusMsg && (
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                      {statusMsg}
                    </div>
                  )}

                  {!otpSent ? (
                    /* Step 1: Enter Admin Email */
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          एडमिन ईमेल आईडी (Admin Email)
                        </label>
                        <div className="relative">
                          <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder="admin@gmail.com"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          * सिस्टम में सेट किया गया एडमिन ईमेल दर्ज करें।
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 transition disabled:opacity-50"
                      >
                        {loading ? (
                          <span>OTP भेजा जा रहा है...</span>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>सुरक्षित OTP प्राप्त करें</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Step 2: Enter 6-digit OTP */
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            6-अंकीय OTP (One Time Password)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpSent(false);
                              setOtpCode("");
                            }}
                            className="text-xs text-blue-600 hover:underline font-semibold"
                          >
                            ईमेल बदलें
                          </button>
                        </div>

                        <div className="relative">
                          <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="123456"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-lg font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                          />
                        </div>

                        {backupOtp && (
                          <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                            <span className="font-bold">त्वरित परीक्षण OTP: </span>
                            <span className="font-mono font-black text-sm text-blue-700 bg-white px-2 py-0.5 rounded border border-amber-300">
                              {backupOtp}
                            </span>
                            <span className="block text-[11px] text-amber-600 mt-0.5">
                              (ईमेल के अलावा स्क्रीन पर भी सुरक्षित बैकअप उपलब्ध कराया गया है)
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={verifying}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition disabled:opacity-50"
                      >
                        {verifying ? (
                          <span>सत्यापित किया जा रहा है...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>लॉगिन करें व डैशबोर्ड खोलें</span>
                          </>
                        )}
                      </button>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={loading}
                          className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
                        >
                          OTP नहीं मिला? पुनः भेजें (Resend)
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Footer Info Strip */}
      <section className="bg-white border-t border-slate-200 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">DFI Core Engine:</span>
            <span>Astra DB Serverless • Razorpay Live • Multi-Channel OTP</span>
          </div>
          <div className="text-slate-400">
            सुरक्षित एन्क्रिप्शन AES-256 एवं JWT प्रमाणीकरण द्वारा रक्षित
          </div>
        </div>
      </section>
    </div>
  );
}
