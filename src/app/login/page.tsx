"use client";

import { useEffect, useState } from "react";
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
  UserPlus,
  Building,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Active view: "password" | "otp" | "register" | "forgot"
  const [activeView, setActiveView] = useState<"password" | "otp" | "register" | "forgot">("password");
  const [applyGroupId, setApplyGroupId] = useState<string>("");

  // Form states - Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login states
  const [otpLoginEmail, setOtpLoginEmail] = useState("");
  const [otpLoginCode, setOtpLoginCode] = useState("");
  const [otpSentForLogin, setOtpSentForLogin] = useState(false);

  // Registration states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regAadhaar, setRegAadhaar] = useState("");
  const [regPan, setRegPan] = useState("");
  const [regAccountNo, setRegAccountNo] = useState("");
  const [regIfsc, setRegIfsc] = useState("");
  const [regUpi, setRegUpi] = useState("");

  // Forgot Password states
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotDob, setForgotDob] = useState("");
  const [forgotUserId, setForgotUserId] = useState("");
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const groupParam = params.get("apply_group") || params.get("group_id");

      if (groupParam) {
        setApplyGroupId(groupParam);
      }

      if (tabParam === "register" || groupParam) {
        setActiveView("register");
      }
    }
  }, []);

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

      // If user came from a group apply link
      if (applyGroupId) {
        await fetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group_id: applyGroupId }),
        });
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

      if (applyGroupId) {
        await fetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group_id: applyGroupId }),
        });
      }

      router.push(data.redirectTo || "/dashboard");
    } catch {
      setError("सर्वर से जुड़ने में समस्या हुई।");
      setLoading(false);
    }
  };

  // 4. Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          mobile: regMobile,
          dob: regDob,
          aadhaar: regAadhaar,
          pan: regPan,
          bank_details: {
            account_number: regAccountNo,
            ifsc: regIfsc,
            upi_id: regUpi,
          },
          group_id: applyGroupId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "पंजीकरण असफल रहा।");
        setLoading(false);
        return;
      }

      alert("✅ " + data.message);
      router.push(data.redirectTo || "/dashboard");
    } catch {
      setError("सर्वर से जुड़ने में समस्या हुई। कृपया दोबारा प्रयास करें।");
      setLoading(false);
    }
  };

  // 5. Forgot Password: Step 1 Send OTP via Mobile + DOB
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

  // 6. Forgot Password: Step 2 Reset Password with OTP
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
      setSuccessMsg("नया पासवर्ड सेट हो गया है। अब नए पासवर्ड से लॉगिन करें।");
      setLoading(false);
    } catch {
      setError("सर्वर से जुड़ने में समस्या हुई।");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className={`w-full ${activeView === "register" ? "max-w-xl" : "max-w-md"} bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden transition-all duration-200`}>
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 p-6 sm:p-8 text-white text-center relative">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-2.5 shadow-inner">
            <Shield className="w-6 h-6 text-sky-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">BBCC FUND GRUP</h2>
          <p className="mt-1 text-xs font-semibold text-slate-300">
            {activeView === "register"
              ? "पारदर्शी बचत समिति — नया क्लाइंट रजिस्ट्रेशन"
              : "ईमेल (Gmail) एवं सुरक्षित पासवर्ड आधारित लॉगिन"}
          </p>

          <Link
            href="/rules"
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 underline font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ग्रुप के आधिकारिक नियम व शर्तें पढ़ें</span>
          </Link>
        </div>

        {/* View Switcher Tabs (Only if not in forgot password mode) */}
        {activeView !== "forgot" && (
          <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50 p-1.5 gap-1 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveView("password");
                resetMessages();
              }}
              className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                activeView === "password"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <KeyRound className="w-3 h-3" />
              <span>लॉगिन</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView("otp");
                resetMessages();
              }}
              className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                activeView === "otp"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>ईमेल OTP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView("register");
                resetMessages();
              }}
              className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                activeView === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3 h-3" />
              <span>रजिस्टर</span>
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
                  पंजीकृत ईमेल (Gmail ID)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="उदा. sky140052@gmail.com"
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

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-500">खाता नहीं है? </span>
                <button
                  type="button"
                  onClick={() => setActiveView("register")}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  यहाँ नया खाता बनाएं
                </button>
              </div>
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
                    ईमेल दोबारा बदलें
                  </button>
                </form>
              )}
            </div>
          )}

          {/* VIEW 3: Public Registration */}
          {activeView === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">पूरा नाम (Full Name)</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. अमित कुमार"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ईमेल (Gmail ID)</label>
                  <input
                    type="email"
                    required
                    placeholder="amit@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">पासवर्ड बनाएं (कम से कम 6 अक्षर)</label>
                  <input
                    type="password"
                    required
                    placeholder="अपनी पसंद का पासवर्ड"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">मोबाइल नंबर</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-अंकीय मोबाइल"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">जन्मतिथि (DOB)</label>
                  <input
                    type="text"
                    required
                    placeholder="DDMMYYYY (01011995)"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">आधार नंबर (12 अंक)</label>
                  <input
                    type="text"
                    required
                    placeholder="XXXX-XXXX-XXXX"
                    value={regAadhaar}
                    onChange={(e) => setRegAadhaar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">पैन कार्ड नंबर (PAN)</label>
                  <input
                    type="text"
                    required
                    placeholder="ABCDE1234F"
                    value={regPan}
                    onChange={(e) => setRegPan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">बैंक खाता नंबर (Payout हेतु)</label>
                <input
                  type="text"
                  placeholder="अकाउंट नंबर दर्ज करें"
                  value={regAccountNo}
                  onChange={(e) => setRegAccountNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC कोड</label>
                  <input
                    type="text"
                    placeholder="SBIN0001234"
                    value={regIfsc}
                    onChange={(e) => setRegIfsc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    placeholder="name@upi"
                    value={regUpi}
                    onChange={(e) => setRegUpi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                {loading ? "रजिस्टर किया जा रहा है..." : "खाता बनाएं व आवेदन करें (Register)"}
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-500">पहले से पंजीकृत हैं? </span>
                <button
                  type="button"
                  onClick={() => setActiveView("password")}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  यहाँ लॉगिन करें
                </button>
              </div>
            </form>
          )}

          {/* VIEW 4: Forgot Password Flow */}
          {activeView === "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-brand-600" />
                  <span>पासवर्ड रीसेट करें</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView("password");
                    resetMessages();
                    setForgotStep(1);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  लॉगिन पर वापस जाएं
                </button>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotSendOtp} className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    अपना पंजीकृत <strong>मोबाइल नंबर</strong> और <strong>जन्मतिथि (DOB)</strong> दर्ज करें।
                    सिस्टम आपके रजिस्टर्ड ईमेल पर OTP भेजेगा।
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
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      जन्मतिथि (DOB - DDMMYYYY)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="01011995"
                        value={forgotDob}
                        onChange={(e) => setForgotDob(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                  >
                    {loading ? "जांच हो रही है..." : "ईमेल पर 6-अंकीय OTP भेजें"}
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
