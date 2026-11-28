"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  User,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  KeyRound,
  LogIn,
  UserPlus,
} from "lucide-react";
import { compressImage } from "../lib/compress";

export default function AppEntryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const regFileInputRef = useRef<HTMLInputElement>(null);

  // Top level view: "initial" (Google 1-Tap & Email OTP) | "complete_kyc" (Google 1-Tap KYC completion)
  const [viewState, setViewState] = useState<"initial" | "complete_kyc">("initial");
  const [checkingSession, setCheckingSession] = useState(true);

  // Google Credential & Data
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [savedCredential, setSavedCredential] = useState<string>("");

  // KYC Form Fields (for Google 1-Tap new users)
  const [photo, setPhoto] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [aadhaar, setAadhaar] = useState<string>("");
  const [pan, setPan] = useState<string>("");
  const [submittingKyc, setSubmittingKyc] = useState(false);

  // Manual Email & OTP States
  const [emailTab, setEmailTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regAadhaar, setRegAadhaar] = useState("");
  const [regPan, setRegPan] = useState("");
  const [regPhoto, setRegPhoto] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [activeEmail, setActiveEmail] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [needsRegNotice, setNeedsRegNotice] = useState(false);

  // Feedback Messages
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // 1. Handle Google Credential Response (Google 1-Tap & Standard Button)
  const handleGoogleCredentialResponse = useCallback(
    async (response: any) => {
      if (!response?.credential) return;
      setGoogleLoading(true);
      setErrorMsg("");
      setStatusMsg("Google द्वारा आपकी पहचान सत्यापित की जा रही है...");

      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Google प्रमाणीकरण विफल रहा।");
        }

        // Case A: Existing user or Admin -> Instant Login!
        if (!data.isNewUser && data.token) {
          if (typeof window !== "undefined") {
            localStorage.setItem("dfi_token", data.token);
            if (data.user) localStorage.setItem("dfi_user", JSON.stringify(data.user));
            if (data.user?.email) localStorage.setItem("dfi_user_email", data.user.email);
            if (data.user?.mobile) localStorage.setItem("dfi_user_mobile", data.user.mobile);
          }

          setStatusMsg("✓ " + (data.message || "लॉगिन सफल! डैशबोर्ड लोड हो रहा है..."));
          setTimeout(() => {
            router.replace(data.redirectTo || "/dashboard");
          }, 400);
          return;
        }

        // Case B: New User -> Open KYC Form with Google details pre-filled!
        if (data.isNewUser && data.googleData) {
          setSavedCredential(response.credential);
          setEmail(data.googleData.email || "");
          setName(data.googleData.name || "");
          setPhoto(data.googleData.photo || "");
          if (data.googleData.mobile) setMobile(data.googleData.mobile);
          if (data.googleData.aadhaar) setAadhaar(data.googleData.aadhaar);
          if (data.googleData.pan) setPan(data.googleData.pan);

          setViewState("complete_kyc");
          setStatusMsg("✓ Google से ईमेल व फोटो सत्यापित! कृपया नीचे मोबाइल व आधार नंबर दर्ज करके रजिस्ट्रेशन पूरा करें।");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Google लॉगिन में त्रुटि हुई।");
      } finally {
        setGoogleLoading(false);
      }
    },
    [router]
  );

  // 2. Initialize Google One-Tap & Render Button
  const initGoogleServices = useCallback(
    (clientId: string) => {
      if (typeof window === "undefined") return;
      const g = (window as any).google;
      if (!g?.accounts?.id) return;

      try {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
        });

        // Prompt Google One Tap natively
        g.accounts.id.prompt();

        // Render native Google Sign-in button
        const btnElem = document.getElementById("google-login-btn-container");
        if (btnElem) {
          g.accounts.id.renderButton(btnElem, {
            theme: "outline",
            size: "large",
            width: 320,
            text: "continue_with",
            shape: "pill",
          });
        }
      } catch (err) {
        console.warn("Google GSI initialization notice:", err);
      }
    },
    [handleGoogleCredentialResponse]
  );

  // 3. Preload Settings & Check Active Session on Mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndLoadSettings() {
      // Step A: Check session
      try {
        const localToken = typeof window !== "undefined" ? localStorage.getItem("dfi_token") : null;
        const headers: Record<string, string> = {};
        if (localToken) headers["Authorization"] = `Bearer ${localToken}`;

        const res = await fetch("/api/auth/me", { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            const target =
              data.user.role === "admin" || data.user.role === "founder"
                ? "/admin"
                : "/dashboard";
            router.replace(target);
            return;
          }
        }
      } catch {
        // Not authenticated
      } finally {
        if (isMounted) setCheckingSession(false);
      }

      // Step B: Load Google Client ID from Settings or Env
      try {
        const settingsRes = await fetch("/api/admin/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          const clientId =
            settingsData?.settings?.google_client_id ||
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
            "";

          if (clientId && isMounted) {
            setGoogleClientId(clientId);

            if (!document.getElementById("google-gsi-script")) {
              const script = document.createElement("script");
              script.id = "google-gsi-script";
              script.src = "https://accounts.google.com/gsi/client";
              script.async = true;
              script.defer = true;
              script.onload = () => {
                initGoogleServices(clientId);
              };
              document.body.appendChild(script);
            } else {
              initGoogleServices(clientId);
            }
          }
        }
      } catch (e) {
        console.warn("Could not load Google settings:", e);
      }
    }

    checkAuthAndLoadSettings();

    return () => {
      isMounted = false;
    };
  }, [router, initGoogleServices]);

  // Handle Photo Selection & Compression for Google KYC
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
      setPhoto(compressed);
    } catch {
      setErrorMsg("फोटो लोड करने में त्रुटि हुई।");
    }
  };

  // Handle Photo Selection & Compression for Manual Registration
  const handleRegPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
      setRegPhoto(compressed);
    } catch {
      setErrorMsg("फोटो लोड करने में त्रुटि हुई।");
    }
  };

  // Switch Manual Email Tab
  const switchEmailTab = (tab: "login" | "register") => {
    setEmailTab(tab);
    setOtpSent(false);
    setOtpCode("");
    setErrorMsg("");
    setStatusMsg("");
    setNeedsRegNotice(false);
  };

  // 4. Manual Email Login: Send OTP
  const handleSendLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    setNeedsRegNotice(false);

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("कृपया अपना मान्य ईमेल (Gmail) दर्ज करें।");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.needs_registration) {
          setNeedsRegNotice(true);
          throw new Error(data.error || "यह ईमेल पंजीकृत नहीं है। कृपया नया सदस्य पंजीकरण करें।");
        }
        throw new Error(data.error || "OTP भेजने में विफल।");
      }

      setActiveEmail(cleanEmail);
      setOtpSent(true);
      setResendTimer(30);
      setStatusMsg(`✓ ईमेल ${cleanEmail} पर 6-अंकीय OTP भेजा गया है। अपना ईमेल चेक करें।`);
    } catch (err: any) {
      setErrorMsg(err.message || "OTP भेजने में त्रुटि हुई।");
    } finally {
      setSendingOtp(false);
    }
  };

  // 5. Manual Email Registration: Send OTP
  const handleSendRegisterOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanMobile = regMobile.replace(/\D/g, "").slice(-10);
    const cleanAadhaar = regAadhaar.replace(/\D/g, "");
    const cleanPan = regPan.toUpperCase().trim();

    if (!cleanName) {
      setErrorMsg("कृपया अपना पूरा नाम दर्ज करें।");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("कृपया अपना मान्य ईमेल (Gmail) पता दर्ज करें।");
      return;
    }
    if (cleanMobile.length !== 10) {
      setErrorMsg("कृपया 10-अंकीय मान्य मोबाइल नंबर दर्ज करें।");
      return;
    }
    if (cleanAadhaar.length !== 12) {
      setErrorMsg("कृपया 12-अंकों का आधार नंबर दर्ज करें।");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          mobile: cleanMobile,
          aadhaar_number: cleanAadhaar,
          pan_number: cleanPan,
          photo: regPhoto,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "रजिस्ट्रेशन OTP भेजने में विफल।");
      }

      setActiveEmail(cleanEmail);
      setOtpSent(true);
      setResendTimer(30);
      setStatusMsg(`✓ ${cleanName} जी, आपके ईमेल ${cleanEmail} पर 6-अंकीय OTP भेजा गया है।`);
    } catch (err: any) {
      setErrorMsg(err.message || "OTP भेजने में त्रुटि हुई।");
    } finally {
      setSendingOtp(false);
    }
  };

  // 6. Verify Email OTP (Works for both Login & Register)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    const cleanOtp = otpCode.replace(/\D/g, "").trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg("कृपया 6-अंकीय पूरा OTP दर्ज करें।");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activeEmail,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "अमान्य या समय समाप्त OTP!");
      }

      if (typeof window !== "undefined") {
        if (data.token) localStorage.setItem("dfi_token", data.token);
        if (data.user) localStorage.setItem("dfi_user", JSON.stringify(data.user));
        if (data.user?.email) localStorage.setItem("dfi_user_email", data.user.email);
        if (data.user?.mobile) localStorage.setItem("dfi_user_mobile", data.user.mobile);
      }

      setStatusMsg("✓ " + (data.message || "लॉगिन सफल! डैशबोर्ड लोड हो रहा है..."));
      setTimeout(() => {
        router.replace(data.redirectTo || "/dashboard");
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || "OTP सत्यापन में त्रुटि हुई।");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // 7. Submit Completed KYC Registration Form (From Google 1-Tap)
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
    const cleanAadhaar = aadhaar.replace(/\D/g, "");

    if (!name.trim()) {
      setErrorMsg("कृपया अपना पूरा नाम दर्ज करें।");
      return;
    }
    if (cleanMobile.length !== 10) {
      setErrorMsg("कृपया 10-अंकीय मान्य मोबाइल नंबर दर्ज करें।");
      return;
    }
    if (cleanAadhaar.length !== 12) {
      setErrorMsg("कृपया 12-अंकों का आधार नंबर दर्ज करें।");
      return;
    }

    setSubmittingKyc(true);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: savedCredential,
          memberDetails: {
            name: name.trim(),
            mobile: cleanMobile,
            aadhaar_number: cleanAadhaar,
            pan_number: pan.toUpperCase().trim(),
            photo,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "रजिस्ट्रेशन पूरा करने में त्रुटि हुई।");
      }

      if (typeof window !== "undefined") {
        if (data.token) localStorage.setItem("dfi_token", data.token);
        if (data.user) localStorage.setItem("dfi_user", JSON.stringify(data.user));
        if (data.user?.email) localStorage.setItem("dfi_user_email", data.user.email);
        if (data.user?.mobile) localStorage.setItem("dfi_user_mobile", data.user.mobile);
      }

      setStatusMsg("✓ " + (data.message || "रजिस्ट्रेशन सफल! डैशबोर्ड लोड हो रहा है..."));
      setTimeout(() => {
        router.replace(data.redirectTo || "/dashboard");
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "रजिस्ट्रेशन सबमिट करने में विफल।");
    } finally {
      setSubmittingKyc(false);
    }
  };

  // Loading Splash Screen while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
          DFI
        </div>
        <div className="mt-4 flex items-center gap-2 text-slate-300 text-xs font-bold">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>DFI सुरक्षित सत्र लोड हो रहा है...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 border border-slate-100 relative overflow-hidden animate-fade-in">
        
        {/* Top Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 mx-auto">
            DFI
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">
            DFI इमरजेंसी सेवा ग्रुप
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            100% पारदर्शी, सुरक्षित एवं पंजीकृत कम्युनिटी फंड
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold space-y-2 animate-shake">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            {needsRegNotice && emailTab === "login" && (
              <button
                type="button"
                onClick={() => {
                  setRegEmail(loginEmail);
                  switchEmailTab("register");
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>इस ईमेल से नया सदस्य पंजीकरण करें →</span>
              </button>
            )}
          </div>
        )}
        {statusMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-scale-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* ========================================================
            VIEW 1: INITIAL SCREEN (GOOGLE 1-TAP + MANUAL EMAIL & OTP)
            ======================================================== */}
        {viewState === "initial" && (
          <div className="space-y-4 pt-1">
            
            {/* 1. Google 1-Tap Section */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-blue-50/90 to-indigo-50/60 border border-blue-200/80 text-center space-y-2.5">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Google 1-Tap से तुरंत प्रवेश</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                बिना पासवर्ड या OTP के 1-टच में सुरक्षित लॉगिन या नया रजिस्ट्रेशन करें
              </p>

              {/* Native Google Button Mount Point */}
              <div className="flex flex-col items-center justify-center min-h-[44px] pt-0.5">
                {googleLoading ? (
                  <div className="flex items-center gap-2 py-2 text-xs font-bold text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Google पहचान सत्यापित की जा रही है...</span>
                  </div>
                ) : (
                  <div id="google-login-btn-container" className="w-full flex justify-center min-h-[42px]">
                    {!googleClientId && (
                      <button
                        type="button"
                        onClick={() => {
                          alert("Render Environment में GOOGLE_CLIENT_ID सेट करते ही यह बटन सक्रिय हो जाएगा।");
                        }}
                        className="w-full max-w-xs flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition active:scale-95"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Google से 1-Tap लॉगिन</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sleek Divider: OR via Email */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                अथवा ईमेल द्वारा (OR via Email)
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Manual Email Mode Selector Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => switchEmailTab("login")}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  emailTab === "login"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>लॉगिन करें</span>
              </button>
              <button
                type="button"
                onClick={() => switchEmailTab("register")}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  emailTab === "register"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>नया रजिस्ट्रेशन</span>
              </button>
            </div>

            {/* =======================================
                TAB A: MANUAL EMAIL LOGIN
                ======================================= */}
            {emailTab === "login" && (
              <div className="space-y-3 pt-1">
                {!otpSent ? (
                  // Step A: Enter Email & Send OTP
                  <form onSubmit={handleSendLoginOtp} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        पंजीकृत ईमेल आईडी (Gmail Address) *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="उदा. name@gmail.com"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={sendingOtp || !loginEmail.trim()}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {sendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>OTP भेजा जा रहा है...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>ईमेल पर OTP प्राप्त करें (Send OTP)</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  // Step B: Enter Received OTP & Verify
                  <form onSubmit={handleVerifyOtp} className="space-y-3 animate-scale-in">
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                      <div className="truncate">
                        <span className="text-[10px] text-blue-600 block font-bold">भेजा गया ईमेल:</span>
                        <span className="font-mono font-bold text-xs">{activeEmail}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                        }}
                        className="text-[11px] text-blue-700 font-bold hover:underline shrink-0 ml-2"
                      >
                        ईमेल बदलें
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        ईमेल पर प्राप्त 6-अंकीय OTP दर्ज करें *
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="• • • • • •"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={verifyingOtp || otpCode.length !== 6}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {verifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>सत्यापित किया जा रहा है...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>सत्यापित करें और लॉगिन करें</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      {resendTimer > 0 ? (
                        <p className="text-[11px] text-slate-400 font-medium">
                          पुनः OTP भेजें ({resendTimer}s)
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendLoginOtp()}
                          disabled={sendingOtp}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1 mx-auto"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>पुनः नया OTP भेजें (Resend OTP)</span>
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* =======================================
                TAB B: MANUAL EMAIL REGISTRATION
                ======================================= */}
            {emailTab === "register" && (
              <div className="space-y-3 pt-1">
                {!otpSent ? (
                  // Step A: Fill Registration Details & Send OTP
                  <form onSubmit={handleSendRegisterOtp} className="space-y-2.5">
                    
                    {/* Optional Photo Upload */}
                    <div className="text-center pb-1">
                      <input
                        type="file"
                        ref={regFileInputRef}
                        accept="image/*"
                        onChange={handleRegPhotoSelect}
                        className="hidden"
                      />
                      <div
                        onClick={() => regFileInputRef.current?.click()}
                        className="w-16 h-16 rounded-full border-2 border-dashed border-blue-400/80 p-0.5 bg-blue-50/50 mx-auto relative cursor-pointer group hover:border-blue-600 transition shadow-xs flex items-center justify-center overflow-hidden"
                        title="फ़ोटो अपलोड करें (वैकल्पिक)"
                      >
                        {regPhoto ? (
                          <img
                            src={regPhoto}
                            alt="Reg Preview"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-blue-600">
                            <Camera className="w-5 h-5" />
                            <span className="text-[8px] font-bold mt-0.5">फ़ोटो जोड़ें</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">
                        पूरा नाम (Full Name) *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="उदा. राहुल कुमार"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">
                        ईमेल आईडी (Email ID) *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="name@gmail.com"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Mobile Number (+91, Manual Input Only - NO SMS OTP) */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">
                        मोबाइल नंबर (10-Digit Mobile) *
                      </label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-bold">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={regMobile}
                          onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, ""))}
                          placeholder="9876543210"
                          className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Aadhaar Number (12 Digits Manual Input) */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">
                        आधार कार्ड नंबर (12-Digit Aadhaar) *
                      </label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          maxLength={12}
                          value={regAadhaar}
                          onChange={(e) => setRegAadhaar(e.target.value.replace(/\D/g, ""))}
                          placeholder="12-अंकों का आधार नंबर"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* PAN Card (Optional) */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">
                        पैन कार्ड नंबर (PAN Card - ऐच्छिक)
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength={10}
                          value={regPan}
                          onChange={(e) => setRegPan(e.target.value.toUpperCase())}
                          placeholder="ABCDE1234F (वैकल्पिक)"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Submit Registration Form */}
                    <div className="pt-1.5">
                      <button
                        type="submit"
                        disabled={sendingOtp}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {sendingOtp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>OTP भेजा जा रहा है...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            <span>ईमेल पर OTP प्राप्त करें (Send OTP)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  // Step B: Enter Registration OTP & Join
                  <form onSubmit={handleVerifyOtp} className="space-y-3 animate-scale-in">
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                      <div className="truncate">
                        <span className="text-[10px] text-blue-600 block font-bold">भेजा गया ईमेल:</span>
                        <span className="font-mono font-bold text-xs">{activeEmail}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                        }}
                        className="text-[11px] text-blue-700 font-bold hover:underline shrink-0 ml-2"
                      >
                        विवरण बदलें
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        ईमेल पर भेजा गया 6-अंकीय OTP दर्ज करें *
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="• • • • • •"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={verifyingOtp || otpCode.length !== 6}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {verifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>पंजीकरण पूरा किया जा रहा है...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>OTP सत्यापित करें और सदस्य बनें (Join DFI)</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      {resendTimer > 0 ? (
                        <p className="text-[11px] text-slate-400 font-medium">
                          पुनः OTP भेजें ({resendTimer}s)
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendRegisterOtp()}
                          disabled={sendingOtp}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1 mx-auto"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>पुनः नया OTP भेजें (Resend OTP)</span>
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            VIEW 2: NEW REGISTRATION FROM GOOGLE 1-TAP (KYC COMPLETION)
            ======================================================== */}
        {viewState === "complete_kyc" && (
          <form onSubmit={handleCompleteRegistration} className="space-y-3 pt-1 animate-scale-in">
            
            {/* Top Google Verified Badge & Avatar Photo */}
            <div className="text-center pt-1 pb-1">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full border-4 border-emerald-500/30 p-1 bg-slate-50 mx-auto relative cursor-pointer group hover:border-emerald-500 transition shadow-xs flex items-center justify-center overflow-hidden"
                title="फ़ोटो बदलें"
              >
                {photo ? (
                  <img
                    src={photo}
                    alt="Member Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex flex-col items-center justify-center">
                    <User className="w-6 h-6 stroke-[2]" />
                  </div>
                )}
                <span className="absolute bottom-0 right-0 p-1 bg-emerald-600 text-white rounded-full shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                <span>Google फ़ोटो व ईमेल सत्यापित ✓</span>
              </div>
            </div>

            <div className="space-y-2.5">
              
              {/* Google Verified Email (Locked) */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  ईमेल आईडी (Google Verified)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-9 pr-8 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-mono font-bold text-emerald-900 cursor-not-allowed"
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Full Name (Pre-filled from Google, editable) */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  पूरा नाम (Full Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="उदा. राहुल कुमार"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Mobile Number (Manual Field - NO SMS OTP) */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  मोबाइल नंबर (Mobile Number) *
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    autoFocus
                  />
                </div>
              </div>

              {/* Aadhaar Number (Manual Field) */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  आधार नंबर (12-Digit Aadhaar) *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                    placeholder="12-अंकों का आधार नंबर"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* PAN Number (Manual Field - Optional) */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  पैन नंबर (PAN Card)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F (वैकल्पिक)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Submit Registration Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingKyc}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingKyc ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>सदस्यता जोड़ी जा रही है...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>रजिस्ट्रेशन पूरा करें और सदस्य बनें (Join DFI)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setViewState("initial");
                    setErrorMsg("");
                    setStatusMsg("");
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:underline"
                >
                  ← वापस जाएं (Google अकाउंट बदलें)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Security Footer Notice */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Google SSL एन्क्रिप्टेड • 10-वर्षीय स्थायी ऑटो-लॉगिन सुरक्षित</span>
          </p>
        </div>
      </div>
    </div>
  );
}
