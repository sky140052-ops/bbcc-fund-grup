"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Mail,
  ArrowRight,
  Info,
  BookOpen,
  CheckCircle2,
  Phone,
  Calendar,
  UserPlus,
  Building,
  Camera,
  FileText,
  Upload,
  Lock,
  UserCheck,
  CreditCard,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Active view: "otp_login" | "kyc_register"
  const [activeView, setActiveView] = useState<"otp_login" | "kyc_register">("otp_login");
  const [applyGroupId, setApplyGroupId] = useState<string>("");

  // OTP Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [backupOtp, setBackupOtp] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Loan-Grade KYC Registration states
  const [regName, setRegName] = useState("");
  const [regFatherName, setRegFatherName] = useState("");
  const [regGender, setRegGender] = useState("पुरुष");
  const [regMaritalStatus, setRegMaritalStatus] = useState("विवाहित");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regPincode, setRegPincode] = useState("");
  const [regOccupation, setRegOccupation] = useState("");
  const [regMonthlyIncome, setRegMonthlyIncome] = useState("");
  const [regNomineeName, setRegNomineeName] = useState("");
  const [regNomineeRelation, setRegNomineeRelation] = useState("पत्नी");
  const [regNomineeMobile, setRegNomineeMobile] = useState("");

  // Document states
  const [regAadhaar, setRegAadhaar] = useState("");
  const [regAadhaarFront, setRegAadhaarFront] = useState("");
  const [regAadhaarBack, setRegAadhaarBack] = useState("");
  const [regPhotoLive, setRegPhotoLive] = useState("");
  const [regPan, setRegPan] = useState("");
  const [regPanType, setRegPanType] = useState<"physical" | "epan">("physical");
  const [regPanDocument, setRegPanDocument] = useState("");
  const [regEpanPassword, setRegEpanPassword] = useState("");

  // Bank states
  const [regAccountNo, setRegAccountNo] = useState("");
  const [regIfsc, setRegIfsc] = useState("");
  const [regUpi, setRegUpi] = useState("");

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
        setActiveView("kyc_register");
      }
    }
  }, []);

  const resetMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("कृपया 3MB से कम आकार की फ़ाइल चुनें।");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 1. Send OTP Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "OTP भेजने में समस्या आई।");
        setLoading(false);
        return;
      }

      setOtpSent(true);
      if (data.backup_otp) {
        setBackupOtp(data.backup_otp);
      }
      setSuccessMsg(data.message);
      setLoading(false);
    } catch {
      setError("सर्वर से जुड़ने में समस्या हुई। कृपया पुनः प्रयास करें।");
      setLoading(false);
    }
  };

  // 2. Verify OTP & Login Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          otp: otpCode,
          remember_me: rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "OTP सत्यापन असफल रहा।");
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
      setError("सर्वर से जुड़ने में समस्या हुई।");
      setLoading(false);
    }
  };

  // 3. Loan-Grade KYC Registration Handler
  const handleKycRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (regPanType === "epan" && !regEpanPassword.trim()) {
      setError("e-PAN चुनने पर कृपया ई-पैन पीडीएफ का पासवर्ड (DOB DDMMYYYY) दर्ज करें।");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          father_name: regFatherName,
          gender: regGender,
          marital_status: regMaritalStatus,
          email: regEmail,
          mobile: regMobile,
          dob: regDob,
          address: regAddress,
          city: regCity,
          pincode: regPincode,
          occupation: regOccupation,
          monthly_income: regMonthlyIncome,
          nominee_name: regNomineeName,
          nominee_relation: regNomineeRelation,
          nominee_mobile: regNomineeMobile,
          aadhaar: regAadhaar,
          pan: regPan,
          photo_live: regPhotoLive,
          aadhaar_front: regAadhaarFront,
          aadhaar_back: regAadhaarBack,
          pan_type: regPanType,
          pan_document: regPanDocument,
          epan_password: regEpanPassword,
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
        setError(data.error || "पंजीकरण में त्रुटि हुई।");
        setLoading(false);
        return;
      }

      alert("✅ " + data.message);
      router.push(data.redirectTo || "/dashboard");
    } catch {
      setError("सर्वर से जुड़ने में समस्या हुई। कृपया पुनः प्रयास करें।");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div
        className={`w-full ${
          activeView === "kyc_register" ? "max-w-3xl" : "max-w-md"
        } bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden transition-all duration-200`}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 p-6 sm:p-8 text-white text-center relative">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-2.5 shadow-inner">
            <Shield className="w-6 h-6 text-sky-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">BBCC FUND GRUP</h2>
          <p className="mt-1 text-xs font-semibold text-slate-300">
            {activeView === "kyc_register"
              ? "लोन-ग्रेड KYC सत्यापन एवं नया क्लाइंट रजिस्ट्रेशन"
              : "सुरक्षित ईमेल एवं 6-अंकीय OTP आधारित लॉगिन"}
          </p>

          <Link
            href="/rules"
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 underline font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ग्रुप के आधिकारिक नियम व शर्तें पढ़ें</span>
          </Link>
        </div>

        {/* View Switcher Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveView("otp_login");
              resetMessages();
            }}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeView === "otp_login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-brand-600" />
            <span>ईमेल OTP लॉगिन</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView("kyc_register");
              resetMessages();
            }}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeView === "kyc_register"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
            <span>लोन-ग्रेड KYC रजिस्ट्रेशन</span>
          </button>
        </div>

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

          {/* VIEW 1: Pure Email & OTP Login (Everyone: Admin & Members) */}
          {activeView === "otp_login" && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      पंजीकृत ईमेल (Gmail ID)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="apna_email@gmail.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold transition"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      एडमिन एवं सदस्य दोनों अपने ईमेल पर OTP प्राप्त कर बिना किसी पासवर्ड के सुरक्षित लॉगिन कर सकते हैं।
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "OTP भेजा जा रहा है..." : "ईमेल पर 6-अंकीय OTP भेजें"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 text-center">
                    <span className="text-xs text-slate-500">नया खाता खोलना चाहते हैं? </span>
                    <button
                      type="button"
                      onClick={() => setActiveView("kyc_register")}
                      className="text-xs font-bold text-brand-600 hover:underline"
                    >
                      यहाँ KYC रजिस्ट्रेशन करें
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-sky-50 rounded-xl text-xs font-medium text-sky-900 border border-sky-200">
                    📧 <strong>{loginEmail}</strong> पर 6-अंकीय OTP भेज दिया गया है।
                  </div>

                  {backupOtp && (
                    <div className="p-3 bg-amber-50 rounded-xl text-xs font-bold text-amber-900 border border-amber-300 flex items-center justify-between">
                      <span>🔐 स्क्रीन बैकअप OTP: <strong>{backupOtp}</strong></span>
                      <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-950 font-black">
                        ईमेल में देरी हेतु
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      6-अंकीय OTP दर्ज करें
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="XXXXXX"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center tracking-widest text-xl font-black focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="rememberMeCheck"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                    />
                    <label
                      htmlFor="rememberMeCheck"
                      className="text-xs font-bold text-slate-700 select-none cursor-pointer"
                    >
                      मुझे 30 दिनों तक याद रखें (30-Day Session)
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
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:underline"
                  >
                    ईमेल पता बदलें
                  </button>
                </form>
              )}
            </div>
          )}

          {/* VIEW 2: Loan-Grade KYC Registration */}
          {activeView === "kyc_register" && (
            <form onSubmit={handleKycRegister} className="space-y-6">
              <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  <span>लोन-ग्रेड पूर्ण KYC फॉर्म (सभी विवरण अनिवार्य हैं)</span>
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  पारदर्शी बचत एवं लोन सुविधा हेतु आपके सभी दस्तावेज व लाइव फोटो सुरक्षित रूप से एडमिन द्वारा सत्यापित किए जाएंगे।
                </p>
              </div>

              {/* 1. Basic Personal Info */}
              <div className="space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1">
                  1. व्यक्तिगत जानकारी (Personal Details)
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">पूरा नाम (Full Name)</label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. राहुल शर्मा"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">पिता / पति का नाम</label>
                    <input
                      type="text"
                      required
                      placeholder="पिता या पति का पूरा नाम"
                      value={regFatherName}
                      onChange={(e) => setRegFatherName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ईमेल (Gmail ID)</label>
                    <input
                      type="email"
                      required
                      placeholder="apna_email@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>

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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">लिंग (Gender)</label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    >
                      <option value="पुरुष">पुरुष</option>
                      <option value="महिला">महिला</option>
                      <option value="अन्य">अन्य</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">वैवाहिक स्थिति</label>
                    <select
                      value={regMaritalStatus}
                      onChange={(e) => setRegMaritalStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    >
                      <option value="विवाहित">विवाहित</option>
                      <option value="अविवाहित">अविवाहित</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">स्थायी पता (Full Address)</label>
                    <input
                      type="text"
                      required
                      placeholder="मकान नंबर, गली, ग्राम/मोहल्ला"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">शहर व पिनकोड</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        required
                        placeholder="शहर"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="पिनकोड"
                        value={regPincode}
                        onChange={(e) => setRegPincode(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">व्यवसाय (Occupation)</label>
                    <input
                      type="text"
                      placeholder="उदा. व्यापार, नौकरी, कृषि"
                      value={regOccupation}
                      onChange={(e) => setRegOccupation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">अनुमानित मासिक आय</label>
                    <input
                      type="text"
                      placeholder="उदा. ₹25,000/माह"
                      value={regMonthlyIncome}
                      onChange={(e) => setRegMonthlyIncome(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Nominee Details */}
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1">
                  2. नॉमिनी / आपातकालीन संपर्क (Nominee Details)
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">नॉमिनी का नाम</label>
                    <input
                      type="text"
                      required
                      placeholder="नॉमिनी का पूरा नाम"
                      value={regNomineeName}
                      onChange={(e) => setRegNomineeName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">संबंध (Relation)</label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. पत्नी, पिता, भाई"
                      value={regNomineeRelation}
                      onChange={(e) => setRegNomineeRelation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">नॉमिनी मोबाइल</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-अंकीय मोबाइल"
                      value={regNomineeMobile}
                      onChange={(e) => setRegNomineeMobile(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Live Photo & Documents Upload */}
              <div className="space-y-4 pt-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1">
                  3. लाइव फोटो एवं दस्तावेज (Live Photo & Documents)
                </h5>

                {/* Live Photo Upload */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-black text-slate-800">
                        📸 आवेदक की लाइव फोटो (Live Selfie / Photo)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        कैमरा खोलकर साफ चेहरा दिखाते हुए लाइव फोटो लें या अपलोड करें।
                      </p>
                    </div>
                    {regPhotoLive && (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        फोटो लोड है ✅
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    required={!regPhotoLive}
                    onChange={(e) => handleFileUpload(e, setRegPhotoLive)}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer"
                  />

                  {regPhotoLive && (
                    <img
                      src={regPhotoLive}
                      alt="Live Selfie"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-300 shadow-sm"
                    />
                  )}
                </div>

                {/* Aadhaar Details & Front/Back Photos */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      आधार कार्ड नंबर (12 अंक)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="XXXX-XXXX-XXXX"
                      value={regAadhaar}
                      onChange={(e) => setRegAadhaar(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        आधार कार्ड फ्रंट फोटो (Aadhaar Front)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        required={!regAadhaarFront}
                        onChange={(e) => handleFileUpload(e, setRegAadhaarFront)}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white cursor-pointer"
                      />
                      {regAadhaarFront && (
                        <img
                          src={regAadhaarFront}
                          alt="Aadhaar Front"
                          className="mt-2 h-16 object-contain rounded-lg border border-slate-300"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        आधार कार्ड बैक फोटो (Aadhaar Back)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        required={!regAadhaarBack}
                        onChange={(e) => handleFileUpload(e, setRegAadhaarBack)}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white cursor-pointer"
                      />
                      {regAadhaarBack && (
                        <img
                          src={regAadhaarBack}
                          alt="Aadhaar Back"
                          className="mt-2 h-16 object-contain rounded-lg border border-slate-300"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* PAN Card & e-PAN Option */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        पैन कार्ड नंबर (PAN Number)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ABCDE1234F"
                        value={regPan}
                        onChange={(e) => setRegPan(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold uppercase focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        पैन कार्ड प्रकार (PAN Type)
                      </label>
                      <div className="flex items-center gap-4 pt-1 text-xs font-bold text-slate-800">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="panType"
                            checked={regPanType === "physical"}
                            onChange={() => setRegPanType("physical")}
                            className="text-brand-600"
                          />
                          <span>फिजिकल पैन कार्ड (Photo)</span>
                        </label>

                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="panType"
                            checked={regPanType === "epan"}
                            onChange={() => setRegPanType("epan")}
                            className="text-brand-600"
                          />
                          <span>ई-पैन (e-PAN PDF)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {regPanType === "epan" && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <Lock className="w-3.5 h-3.5" />
                        <span>ई-पैन पासवर्ड दर्ज करें (e-PAN Password is Required)</span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e-PAN पासवर्ड (उदा. DDMMYYYY जन्मतिथि)"
                        value={regEpanPassword}
                        onChange={(e) => setRegEpanPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-semibold focus:outline-none"
                      />
                      <p className="text-[11px] text-amber-800 font-medium">
                        आयकर विभाग द्वारा जारी e-PAN पीडीएफ पासवर्ड प्रोटेक्टेड होती है। सत्यापन हेतु पासवर्ड आवश्यक है।
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {regPanType === "epan" ? "ई-पैन (e-PAN) फ़ाइल अपलोड करें" : "पैन कार्ड फोटो अपलोड करें"}
                    </label>
                    <input
                      type="file"
                      required={!regPanDocument}
                      onChange={(e) => handleFileUpload(e, setRegPanDocument)}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white cursor-pointer"
                    />
                    {regPanDocument && regPanType === "physical" && (
                      <img
                        src={regPanDocument}
                        alt="PAN Preview"
                        className="mt-2 h-16 object-contain rounded-lg border border-slate-300"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Bank Details */}
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1">
                  4. बैंक खाता व UPI विवरण (Payout Details)
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">बैंक खाता नंबर</label>
                    <input
                      type="text"
                      required
                      placeholder="अकाउंट नंबर"
                      value={regAccountNo}
                      onChange={(e) => setRegAccountNo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IFSC कोड</label>
                    <input
                      type="text"
                      required
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <span>{loading ? "KYC दस्तावेज सबमिट हो रहे हैं..." : "पूर्ण लोन-ग्रेड KYC सबमिट करें व खाता बनाएं"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setActiveView("otp_login")}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  पहले से खाता है? यहाँ OTP से लॉगिन करें
                </button>
              </div>
            </form>
          )}

          {/* Security Badge */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit SSL एन्क्रिप्टेड • Astra DB क्लाउड सुरक्षित • लोन-ग्रेड सुरक्षा</span>
          </div>
        </div>
      </div>
    </div>
  );
}
