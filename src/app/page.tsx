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
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { compressImage } from "../lib/compress";

export default function AppEntryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication & Mode State
  const [checkingSession, setCheckingSession] = useState(true);
  const [mode, setMode] = useState<"register" | "login">("register");

  // Google 1-Tap State
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  // Form Fields
  const [photo, setPhoto] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [aadhaar, setAadhaar] = useState<string>("");
  const [pan, setPan] = useState<string>("");
  const [otp, setOtp] = useState<string>("");

  // Loading & Feedback
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Handle Google Credential Response
  const handleGoogleCredentialResponse = useCallback(
    async (response: any) => {
      if (!response?.credential) return;
      setGoogleLoading(true);
      setErrorMsg("");
      setStatusMsg("Google द्वारा आपकी पहचान स्वतः सत्यापित की जा रही है...");
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

        if (typeof window !== "undefined") {
          if (data.token) localStorage.setItem("dfi_token", data.token);
          if (data.user) localStorage.setItem("dfi_user", JSON.stringify(data.user));
          if (data.user?.email) localStorage.setItem("dfi_user_email", data.user.email);
        }

        setStatusMsg("✓ " + (data.message || "Google लॉगिन सफल! डैशबोर्ड लोड हो रहा है..."));
        setTimeout(() => {
          router.replace(data.redirectTo || "/dashboard");
        }, 500);
      } catch (err: any) {
        setErrorMsg(err.message || "Google लॉगिन में त्रुटि हुई।");
      } finally {
        setGoogleLoading(false);
      }
    },
    [router]
  );

  // Initialize Google One-Tap & Button
  const initGoogleServices = useCallback(
    (clientId: string) => {
      if (typeof window === "undefined") return;
      const g = (window as any).google;
      if (!g?.accounts?.id) return;

      try {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false, // Prevents auto-loop login right after logout
          cancel_on_tap_outside: false,
        });

        // Prompt Google One Tap natively
        g.accounts.id.prompt();

        // Render standard button
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
        console.warn("GSI initialization error:", err);
      }
    },
    [handleGoogleCredentialResponse]
  );

  // 1. Check if user already has an active permanent session & load Google Client ID
  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndLoadSettings() {
      // Step A: Check existing session
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

      // Step B: Load Google Client ID from settings
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

            // Load Google SDK script dynamically if not present
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
        console.warn("Could not load google client id:", e);
      }
    }

    checkAuthAndLoadSettings();

    return () => {
      isMounted = false;
    };
  }, [router, initGoogleServices]);

  // Handle Photo Upload & Auto Compression
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

  // Step 1: Send OTP to Email (Manual flow)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      setErrorMsg("कृपया मान्य ईमेल (Gmail) आईडी दर्ज करें।");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setErrorMsg("कृपया अपना पूरा नाम दर्ज करें।");
        return;
      }
      const cleanMobile = mobile.replace(/\D/g, "");
      if (cleanMobile.length < 10) {
        setErrorMsg("कृपया 10-अंकीय मान्य मोबाइल नंबर दर्ज करें।");
        return;
      }
      const cleanAadhaar = aadhaar.replace(/\D/g, "");
      if (cleanAadhaar.length !== 12) {
        setErrorMsg("कृपया 12-अंकों का आधार नंबर दर्ज करें।");
        return;
      }
    }

    setLoadingOtp(true);
    try {
      const payload: any = { email: cleanEmail };
      if (mode === "register") {
        payload.name = name.trim();
        payload.mobile = mobile.replace(/\D/g, "");
        payload.photo = photo;
        payload.aadhaar_number = aadhaar.replace(/\D/g, "");
        payload.pan_number = pan.toUpperCase().trim();
      }

      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "OTP भेजने में विफल।");
      }

      setOtpSent(true);
      setStatusMsg(data.message || `ईमेल ${cleanEmail} पर 6-अंकीय OTP भेज दिया गया है।`);
    } catch (err: any) {
      setErrorMsg(err.message || "OTP भेजने में त्रुटि हुई।");
    } finally {
      setLoadingOtp(false);
    }
  };

  // Step 2: Verify OTP and Login / Register (Manual flow)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setErrorMsg("कृपया ईमेल पर आया 6-अंकीय OTP कोड दर्ज करें।");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "OTP अमान्य या समाप्त हो चुका है।");
      }

      // Store permanent session token
      if (typeof window !== "undefined") {
        if (data.token) localStorage.setItem("dfi_token", data.token);
        localStorage.setItem("dfi_user_email", email.trim().toLowerCase());
        if (data.user) localStorage.setItem("dfi_user", JSON.stringify(data.user));
      }

      setStatusMsg("✓ सत्यापन सफल! डैशबोर्ड लोड हो रहा है...");
      setTimeout(() => {
        router.replace(data.redirectTo || "/dashboard");
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "सत्यापन प्रक्रिया में त्रुटि।");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // 2. Loading splash while checking session
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

  // 3. Dedicated Login & Registration Window (No extra screen elements)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 border border-slate-100 relative overflow-hidden animate-fade-in">
        
        {/* Top Decorative Header */}
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

        {/* ⚡ GOOGLE 1-TAP & 1-TOUCH INSTANT LOGIN (NO OTP REQUIRED) */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Google 1-Tap ऑटो लॉगिन (बिना OTP)</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            Google अकाउंट से 1-टच में ईमेल, नाम व फोटो स्वतः वेरीफाई करके तुरंत लॉगिन करें
          </p>

          <div className="flex flex-col items-center justify-center min-h-[42px] pt-1">
            {googleLoading ? (
              <div className="flex items-center gap-2 py-2 text-xs font-bold text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Google अकाउंट से लॉगिन हो रहा है...</span>
              </div>
            ) : (
              <div id="google-login-btn-container" className="w-full flex justify-center min-h-[40px]">
                {!googleClientId && (
                  <button
                    type="button"
                    onClick={() => {
                      alert("एडमिन पोर्टल में Google Client ID सेट करते ही यह 1-क्लिक ऑटो लॉगिन सीधे सक्रिय हो जाएगा। कृपया तब तक नीचे दिए गए ईमेल OTP द्वारा लॉगिन करें।");
                    }}
                    className="w-full max-w-xs flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition active:scale-95"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google से 1-क्लिक ऑटो लॉगिन</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
            अथवा ईमेल OTP द्वारा
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Mode Switcher: Register (KYC) vs Quick Login */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMsg("");
              setStatusMsg("");
              setOtpSent(false);
            }}
            className={`py-2 px-1 rounded-lg transition active:scale-95 truncate ${
              mode === "register"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📝 नया सदस्य (KYC)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg("");
              setStatusMsg("");
              setOtpSent(false);
            }}
            className={`py-2 px-1 rounded-lg transition active:scale-95 truncate ${
              mode === "login"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🔐 ईमेल OTP लॉगिन
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {statusMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-scale-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-3">
          
          {/* REGISTER MODE: Top Photo Upload Avatar */}
          {mode === "register" && !otpSent && (
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
                className="w-20 h-20 rounded-full border-4 border-blue-500/20 p-1 bg-slate-50 mx-auto relative cursor-pointer group hover:border-blue-500 transition shadow-xs flex items-center justify-center overflow-hidden"
                title="फोटो चुनें"
              >
                {photo ? (
                  <img
                    src={photo}
                    alt="Uploaded Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex flex-col items-center justify-center">
                    <Camera className="w-6 h-6 stroke-[2]" />
                    <span className="text-[8px] font-bold mt-0.5 text-blue-700">फोटो चुनें</span>
                  </div>
                )}
                <span className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full shadow-xs">
                  <Camera className="w-3 h-3" />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                अपनी प्रोफ़ाइल फ़ोटो लगाएं (वैकल्पिक / सुरक्षित)
              </p>
            </div>
          )}

          {/* Form Fields: Only shown before OTP is sent */}
          {!otpSent && (
            <div className="space-y-2.5">
              {/* Full Name (in Register mode) */}
              {mode === "register" && (
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
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              {/* Mobile Number (in Register mode) */}
              {mode === "register" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    मोबाइल नंबर (Mobile) *
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
                      className="w-full pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              {/* Email Address (Both modes) */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  ईमेल आईडी (Gmail / Email) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="apnamail@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Aadhaar Number (in Register mode) */}
              {mode === "register" && (
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
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              {/* PAN Number (in Register mode) */}
              {mode === "register" && (
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
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              {/* Button: Get Email OTP */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loadingOtp}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/25 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  {loadingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>OTP भेजा जा रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>OTP प्राप्त करें (Get Email OTP)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* OTP Verification Box (Revealed when OTP is sent) */}
          {otpSent && (
            <div className="space-y-3 pt-1 animate-scale-in">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <p className="text-[11px] font-bold text-blue-900">
                  {email} पर 6-अंकीय OTP भेजा गया है
                </p>
                <p className="text-[10px] text-blue-600 mt-0.5">
                  कृपया अपना ईमेल इनबॉक्स अथवा स्पैम फ़ोल्डर देखें।
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1 text-center">
                  6-अंकीय OTP कोड दर्ज करें
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="w-full py-2.5 text-center bg-slate-50 border border-slate-300 rounded-xl text-lg font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={verifyingOtp}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2"
              >
                {verifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>सत्यापन किया जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>सत्यापित करें और लॉगिन करें (Login)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between px-1 pt-1">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loadingOtp}
                  className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>OTP नहीं मिला? पुनः भेजें</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:underline"
                >
                  ईमेल बदलें
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Security Footer Notice */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>256-Bit SSL एन्क्रिप्टेड • स्थायी ऑटो-लॉगिन सुरक्षित</span>
          </p>
        </div>
      </div>
    </div>
  );
}