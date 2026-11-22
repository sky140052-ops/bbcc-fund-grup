"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  AlertCircle,
  KeyRound,
  FileText,
  X,
  Sparkles,
  PhoneCall,
  Clock,
  UserPlus,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Check if session already active
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch {
        // No active session
      }
    }
    checkSession();
  }, []);

  // Send OTP (Strictly to Email via Brevo API - NO screen display)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      setErrorMsg("कृपया मान्य ईमेल आईडी दर्ज करें।");
      return;
    }

    setLoadingOtp(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "OTP भेजने में विफल।");
      }

      setOtpSent(true);
      setStatusMsg(data.message || `OTP आपके ईमेल ${cleanEmail} पर भेज दिया गया है। कृपया इनबॉक्स/स्पैम चेक करें।`);
    } catch (err: any) {
      setErrorMsg(err.message || "सर्वर से कनेक्ट करने में त्रुटि।");
    } finally {
      setLoadingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    if (otpCode.length < 6) {
      setErrorMsg("कृपया ईमेल पर आया 6-अंकीय OTP दर्ज करें।");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim().toLowerCase(),
          otp: otpCode,
          remember_me: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "OTP अमान्य या समाप्त हो चुका है।");
      }

      setStatusMsg("सत्यापन सफल! डैशबोर्ड पर पुनर्निर्देशित किया जा रहा है...");
      setTimeout(() => {
        if (data.redirectTo) {
          router.push(data.redirectTo);
        } else if (data.user?.role === "admin" || data.user?.role === "founder") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "सत्यापन विफल रहा।");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Direct Go to Dashboard handler
  const handleGoToDashboardClick = () => {
    if (currentUser) {
      if (currentUser.role === "admin" || currentUser.role === "founder") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between">
      {/* Hero & Official Notice Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 w-full space-y-6 sm:space-y-8">
        
        {/* Top Header Card */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs sm:text-sm font-black tracking-wide">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>DFI इमरजेंसी सेवा • आधिकारिक पोर्टल</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            इमरजेंसी सेवा ग्रुप - DFI 🙏
          </h1>

          <p className="text-base sm:text-lg font-bold text-slate-700">
            नमस्ते साथियों,
          </p>

          <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            इमरजेंसी सेवा के लिए एक ग्रुप बनाया गया है जिसका नाम <b>DFI</b> है। यह समूह सदस्यों के
            आपसी सहयोग, पारदर्शी बचत और आकस्मिक वित्तीय सहायता के उद्देश्य से संचालित है।
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 sm:pt-4 pb-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleGoToDashboardClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-500/25 transition transform active:scale-95"
            >
              <span>Go to Dashboard (डैशबोर्ड पर जाएं)</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => router.push("/join")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm transition active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>नए सदस्य स्वयं जुड़ें (Self Registration)</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            * एडमिन एवं सदस्य सुरक्षित ईमेल OTP द्वारा प्रवेश करें।
          </p>
        </div>

        {/* Notice Card 1: मुख्य ग्रुप नियम */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-900">ग्रुप के नियम</h2>
              <p className="text-xs text-slate-500">कृपया सभी 6 नियमों का ध्यानपूर्वक पालन करें</p>
            </div>
          </div>

          <ol className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
            <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <span>
                इस ग्रुप में जो भी सदस्य जुड़ेगा, उसे हर महीने की <b>1 तारीख से 10 तारीख</b> के
                बीच निर्धारित पैसा जमा करना होगा।
              </span>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <span>
                पैसा सभी को अपने <b>UPI के माध्यम से ऑनलाइन</b> जमा करना है।
              </span>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <span>
                शुरू के <b>2 महीने तक कोई भी पैसा नहीं निकाल सकेगा</b>।
              </span>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <span>
                2 महीने के बाद, जमा किया हुआ पैसा आप अपने किसी भी जरूरी काम के लिए ले सकते हैं और
                उपयोग कर सकते हैं।
              </span>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                5
              </span>
              <span>
                लिए गए पैसे पर <b>1% प्रति माह (1% p.m.)</b> ब्याज लगेगा।
              </span>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                6
              </span>
              <span>
                जरूरत पड़ने पर SMS करके, आपने जितना पैसा जमा किया है उसमें से, आपको जितनी जरूरत
                है उतना पैसा निकाल सकते हैं।
              </span>
            </li>
          </ol>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-amber-700 shrink-0" />
            <span>जो भी इस ग्रुप में जुड़ना चाहता है, वह कृपया SMS करें।</span>
          </div>
        </div>

        {/* Notice Card 2: विशेष सूचना */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-8 shadow-xl space-y-4 sm:space-y-5 border border-slate-800">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-yellow-400 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-yellow-400">
                जुनेद भाई के लिए जरूरी सूचना - DFI ग्रुप
              </h2>
              <p className="text-xs text-slate-300">सभी सदस्यों के लिए आवश्यक दिशा-निर्देश</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 font-semibold">
            सभी सदस्यों को सूचित किया जाता है कि:
          </p>

          <ol className="space-y-3 text-xs sm:text-sm text-slate-300 font-medium">
            <li className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <span>
                हर महीने 1 तारीख से 10 तारीख के बीच में सभी लोग <b>वोट करके एक तारीख तय करेंगे</b>।
              </span>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <span>
                जिस तारीख पर सबसे ज्यादा वोट आएगा, उसी तारीख को सभी को पैसा जमा करना होगा।
              </span>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <span>
                तय तारीख के बाद पैसा जमा करने के लिए <b>2 दिन का अतिरिक्त समय</b> मिलेगा।
              </span>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <span>
                यदि कोई सदस्य तय तारीख पर पैसा जमा नहीं कर पाता है और <b>2 बार उसका पैसा बाउंस करता है</b>,
                तो उसे ग्रुप से निकाल दिया जाएगा।
              </span>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                5
              </span>
              <span>
                यदि 2 दिन बीत जाने के बाद भी जिसका पैसा बाउंस करता है, तो उसको <b>₹20 जुर्माना (Fine)</b>{" "}
                लगेगा।
              </span>
            </li>
          </ol>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-2 pb-6">
          <button
            onClick={handleGoToDashboardClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-3.5 sm:py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm sm:text-base shadow-lg shadow-blue-600/30 transition transform active:scale-95"
          >
            <span>Go to Dashboard (डैशबोर्ड पर जाएं)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* ======================================================== */}
      {/* LOGIN MODAL (Pure Email OTP Gateway - NO ON-SCREEN OTP)  */}
      {/* ======================================================== */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setOtpSent(false);
                setOtpCode("");
                setErrorMsg("");
                setStatusMsg("");
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                DFI
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">डैशबोर्ड लॉगिन (Email OTP)</h3>
                <p className="text-xs text-slate-500">एडमिन एवं सदस्य सुरक्षित प्रमाणीकरण</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {statusMsg && (
              <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                {statusMsg}
              </div>
            )}

            {!otpSent ? (
              /* Step 1: Enter Email */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    अपना ईमेल दर्ज करें (Email ID)
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    * OTP आपके इस ईमेल पते पर भेजा जाएगा।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loadingOtp}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 transition disabled:opacity-50"
                >
                  {loadingOtp ? (
                    <span>OTP भेजा जा रहा है...</span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>OTP प्राप्त करें (Send to Email)</span>
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
                      ईमेल पर आया 6-अंकीय OTP दर्ज करें
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
                  <p className="text-[11px] text-slate-400 mt-1 text-center">
                    OTP ईमेल के इनबॉक्स या स्पैम (Spam) फोल्डर में जांचें।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition disabled:opacity-50"
                >
                  {verifyingOtp ? (
                    <span>सत्यापन किया जा रहा है...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>लॉगिन करें (Verify & Login)</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
