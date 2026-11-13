"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Info,
  BookOpen,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Phone,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Active view: "password" | "otp" | "forgot"
  const [activeView, setActiveView] = useState<"password" | "otp" | "forgot">("password");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login states
  const [otpLoginEmail, setOtpLoginEmail] = useState("");
  const [otpLoginCode, setOtpLoginCode] = useState("");
  const [otpSentForLogin, setOtpSentForLogin] = useState(false);

  // Forgot Password states
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotDob, setForgotDob] = useState("");
  const [forgotUserId, setForgotUserId] = useState("");
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1 = enter mobile & dob, 2 = enter otp & new pwd

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const resetMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  // 1. Password Login Handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email,
          secret: password,
          remember_me: rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "लॉगिन असफल रहा। कृपया सही ईमेल व पासवर्ड दर्ज करें।");
        setLoading(false);
        return;
      }

      router.push(data.redirectTo || "/dashboard");
    } catch {
      setError("सर्वर से जुड़ने में समस्या हुई। कृपया दोबारा प्रयास करें।");
      setLoading(false);
    }
  };

  // 2. OTP Login Handler: Send OTP
  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpLoginEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "OTP भेजने में समस्या आई।");
        setLoading(false);
        return;
      }

      setOtpSentForLogin(true);
      setSuccessMsg(data.message);
      setLoading(false);
    } catch {
      setError("सर्वर से जुड़ने में समस्या हुई।");
      setLoading(false);
    }
  };

  // 3. OTP Login Handler: Verify OTP
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpLoginEmail,
          otp: otpLoginCode,
          remember_me: rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "OTP सत्यापन असफल रहा।");
        setLoading(false);
        return;
      }

      router.push(data.redirectTo || "/dashboard");
    } catch {
      setError("सर्वर से जुड़ने में समस्या हुई।");
      setLoading(false);
    }
  };

  // 4. Forgot Password: Step 1 Send OTP via Mobile + DOB
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: forgotMobile,
          dob: forgotDob,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "सत्यापन असफल रहा।");
        setLoading(false);
        return;
      }

      setForgotUserId(data.userId);
      setForgotMaskedEmail(data.maskedEmail);
      setForgotStep(2);
      setSuccessMsg(data.message);
      setLoading(false);
    } catch {
      setError("सर्वर से जुड़ने में समस्या हुई।");
      setLoading(false);
    }
  };

  // 5. Forgot Password: Step 2 Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError("नया पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खाते।");
      return;
    }

    if (forgotNewPassword.length < 6) {
      setError("पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: forgotUserId,
          otp: forgotOtp,
          newPassword: forgotNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "पासवर्ड रीसेट असफल रहा।");
        setLoading(false);
        return;
      }

      alert("✅ " + data.message);
      setActiveView("password");
      setPassword("");
      setForgotStep(1);
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      setSuccessMsg("नया पासवर्ड बन गया है! अब नए पासवर्ड से लॉगिन करें।");
      setLoading(false);
    } catch {
      setError("सर्वर से जुड़ने में समस्या हुई।");
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
            ईमेल (Gmail) एवं OTP आधारित सुरक्षित लॉगिन
          </p>

          <Link
            href="/rules"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 underline font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ग्रुप के आधिकारिक नियम व शर्तें पढ़ें</span>
          </Link>
        </div>

        {/* View Switcher Tabs (Only if not in forgot password mode) */}
        {activeView !== "forgot" && (
          <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveView("password");
                resetMessages();
              }}
              className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeView === "password"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>पासवर्ड से लॉगिन</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView("otp");
                resetMessages();
              }}
              className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeView === "otp"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>ईमेल OTP से लॉगिन</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium rounded-xl flex items-start gap-2">
              <Info className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW 1: Password Login */}
          {activeView === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  पंजीकृत ईमेल (Gmail ID) / मोबाइल
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="उदा. yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    पासवर्ड
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("forgot");
                      resetMessages();
                      setForgotStep(1);
                    }}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 underline"
                  >
                    पासवर्ड भूल गए?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="अपना पासवर्ड दर्ज करें"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox (30 Days) */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-xs font-bold text-slate-700 select-none cursor-pointer"
                >
                  मुझे 30 दिनों तक याद रखें (Remember me for 30 Days)
                </label>
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
          )}

          {/* VIEW 2: Email OTP Login */}
          {activeView === "otp" && (
            <div>
              {!otpSentForLogin ? (
                <form onSubmit={handleSendLoginOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      पंजीकृत ईमेल (Gmail ID)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        value={otpLoginEmail}
                        onChange={(e) => setOtpLoginEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold transition"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm shadow-md transition"
                  >
                    {loading ? "भेजा जा रहा है..." : "ईमेल पर 6-अंकीय OTP भेजें"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                  <div className="p-3 bg-sky-50 rounded-xl text-xs font-medium text-sky-800">
                    📧 OTP भेजा गया: <strong>{otpLoginEmail}</strong>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      ईमेल में आया 6-अंकीय OTP दर्ज करें
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6-अंकीय कोड (उदा. 492019)"
                      value={otpLoginCode}
                      onChange={(e) => setOtpLoginCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center tracking-widest text-lg font-black focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Remember Me Checkbox (30 Days) */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="rememberMeOtp"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                    />
                    <label
                      htmlFor="rememberMeOtp"
                      className="text-xs font-bold text-slate-700 select-none cursor-pointer"
                    >
                      मुझे 30 दिनों तक याद रखें (30 Days Session)
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                  >
                    {loading ? "सत्यापित हो रहा है..." : "OTP सत्यापित करें व लॉगिन करें"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSentForLogin(false)}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:underline"
                  >
                    ईमेल बदलें या दोबारा OTP भेजें
                  </button>
                </form>
              )}
            </div>
          )}

          {/* VIEW 3: Forgot Password (Mobile + DOB -> Email OTP -> New Password) */}
          {activeView === "forgot" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>पासवर्ड रीसेट करें (Forgot Password)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView("password");
                    resetMessages();
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕ रद्द करें
                </button>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotSendOtp} className="space-y-3">
                  <p className="text-xs text-slate-600 font-medium">
                    अपने पंजीकृत <strong>मोबाइल नंबर</strong> और <strong>जन्मतिथि</strong> दर्ज करें।
                    सत्यापन कोड (OTP) आपके पंजीकृत ईमेल पर भेजा जाएगा।
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      पंजीकृत मोबाइल नंबर
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="उदा. 9811122233"
                        value={forgotMobile}
                        onChange={(e) => setForgotMobile(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      पंजीकृत जन्मतिथि (DOB)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="DDMMYYYY (उदा. 01011995)"
                        value={forgotDob}
                        onChange={(e) => setForgotDob(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                  >
                    {loading ? "जांच हो रही है..." : "ईमेल पर OTP भेजें (Send OTP)"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="p-2.5 bg-amber-50 rounded-xl text-xs font-medium text-amber-900">
                    📧 आपके ईमेल <strong>{forgotMaskedEmail}</strong> पर 6-अंकीय OTP भेजा गया है।
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ईमेल में आया 6-अंकीय OTP
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6-अंकीय OTP दर्ज करें"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-center tracking-widest text-base font-black focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      नया पासवर्ड (कम से कम 6 अक्षर)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="अपनी पसंद का नया पासवर्ड बनाएं"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      नया पासवर्ड कन्फर्म करें
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="नया पासवर्ड दोबारा दर्ज करें"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                  >
                    {loading ? "सहेजा जा रहा है..." : "नया पासवर्ड सेट करें (Save New Password)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:underline"
                  >
                    मोबाइल या DOB दोबारा दर्ज करें
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Security Badge */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit SSL एन्क्रिप्टेड • Astra DB क्लाउड सुरक्षित</span>
          </div>
        </div>
      </div>
    </div>
  );
}
