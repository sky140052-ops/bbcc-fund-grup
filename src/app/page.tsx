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
  Shield,
} from "lucide-react";
import { compressImage } from "../lib/compress";

export default function AppEntryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth flow states: "initial" (Google 1-Tap / Sign-In) | "complete_kyc" (fill remaining fields)
  const [viewState, setViewState] = useState<"initial" | "complete_kyc">("initial");
  const [checkingSession, setCheckingSession] = useState(true);

  // Google Credential & Data
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [savedCredential, setSavedCredential] = useState<string>("");

  // Form Fields
  const [photo, setPhoto] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [aadhaar, setAadhaar] = useState<string>("");
  const [pan, setPan] = useState<string>("");

  // Submitting & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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
            width: 300,
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

  // Handle Local Photo Selection & Compression
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

  // 4. Submit Completed KYC Registration Form
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

    setSubmitting(true);

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
      setSubmitting(false);
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

        {/* ========================================================
            VIEW 1: INITIAL SCREEN (GOOGLE 1-TAP LOGIN & REGISTER)
            ======================================================== */}
        {viewState === "initial" && (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-50/80 to-indigo-50/50 border border-blue-200/80 text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Google 1-Tap लॉगिन व रजिस्ट्रेशन</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                अपने Google/Gmail अकाउंट से 1-टच में पहचान, नाम व फ़ोटो स्वतः सत्यापित करके सीधे प्रवेश करें।
              </p>

              {/* Native Google Button Mount Point */}
              <div className="flex flex-col items-center justify-center min-h-[44px] pt-1">
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

            {/* Quick Helper Notes */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-start gap-1.5 font-bold text-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>पहले से पंजीकृत सदस्य / एडमिन सीधे लॉगिन होंगे।</span>
              </div>
              <div className="flex items-start gap-1.5 font-bold text-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <span>नए सदस्यों की Google फ़ोटो व ईमेल अपने-आप लेकर फॉर्म खुलेगा।</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 2: NEW REGISTRATION (GOOGLE DATA PRE-FILLED + MANUAL FIELDS)
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
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Mobile Number (Manual Field) */}
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
                    className="w-full pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
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
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
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
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Submit Registration Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
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
            <span>Google SSL एन्क्रिप्टेड • स्थायी ऑटो-लॉगिन सुरक्षित</span>
          </p>
        </div>
      </div>
    </div>
  );
}
