"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Camera,
  Upload,
  CreditCard,
  FileText,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from "lucide-react";
import { compressImage } from "../../lib/compress";

export default function JoinPage() {
  const router = useRouter();

  // Settings State: Check whether Admin has activated the registration link
  const [linkActive, setLinkActive] = useState<boolean | null>(null);
  const [checkingSettings, setCheckingSettings] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.settings) {
          setLinkActive(Boolean(data.settings.registration_link_active));
        } else {
          setLinkActive(false);
        }
      })
      .catch(() => {
        setLinkActive(false);
      })
      .finally(() => {
        setCheckingSettings(false);
      });
  }, []);

  // Step: 1 = Fill Form, 2 = Enter OTP
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState<string>("");
  const [aadhaarFileType, setAadhaarFileType] = useState<"pdf" | "image">("image");
  const [aadhaarFileName, setAadhaarFileName] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [panFile, setPanFile] = useState<string>("");
  const [panFileType, setPanFileType] = useState<"pdf" | "image">("image");
  const [panFileName, setPanFileName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [walletNumber, setWalletNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");

  // OTP State
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Camera Webcam
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setCameraStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      alert("कैमरा चालू करने की अनुमति नहीं मिली।");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        // Auto-compress selfie/photo to max 360x360 at 0.70 quality (~8-12KB)
        const compressed = await compressImage(dataUrl, { maxWidth: 360, maxHeight: 360, quality: 0.7 });
        setPhoto(compressed);
        stopCamera();
      }
    }
  };

  const handleFileUpload = async (
    file: File,
    setFile: (base64: string) => void,
    setType: (t: "pdf" | "image") => void,
    setName: (n: string) => void
  ) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    setType(isPdf ? "pdf" : "image");
    setName(file.name);

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = (e) => setFile(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      // Auto-compress document scan/photo to max 1200x1200px at 0.75 quality (~40-60KB)
      const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.75 });
      setFile(compressed);
    }
  };

  // Step 1: Send Registration OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    if (!name.trim()) {
      setErrorMsg("कृपया अपना पूरा नाम दर्ज करें।");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("कृपया अपना मान्य ईमेल आईडी (Gmail) दर्ज करें।");
      return;
    }
    if (mobile.replace(/\D/g, "").length < 10) {
      setErrorMsg("कृपया 10-अंकीय वैध मोबाइल नंबर दर्ज करें।");
      return;
    }
    if (!photo) {
      setErrorMsg("कृपया अपनी लाइव फोटो (सेल्फी) अवश्य लें या गैलरी से अपलोड करें।");
      return;
    }
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, "");
    if (cleanAadhaar.length !== 12) {
      setErrorMsg("कृपया 12-अंकों का वैध आधार नंबर दर्ज करें।");
      return;
    }
    if (!aadhaarFile) {
      setErrorMsg("कृपया आधार कार्ड का फोटो या पीडीएफ दस्तावेज अवश्य अपलोड करें।");
      return;
    }
    const cleanPan = panNumber.trim().toUpperCase();
    if (!cleanPan || cleanPan.length < 10) {
      setErrorMsg("कृपया 10-अंकों का वैध पैन कार्ड नंबर दर्ज करें।");
      return;
    }
    if (!panFile) {
      setErrorMsg("कृपया पैन कार्ड का फोटो या पीडीएफ दस्तावेज अवश्य अपलोड करें।");
      return;
    }
    if (!upiId.trim() && (!accountNumber.trim() || !ifsc.trim()) && !walletNumber.trim()) {
      setErrorMsg("कृपया बैंक खाता/IFSC, UPI आईडी, या फोनपे/जीपे नंबर दर्ज करें।");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_otp",
          name,
          email,
          mobile,
          photo,
          aadhaar_number: aadhaarNumber,
          aadhaar_file: aadhaarFile,
          aadhaar_file_type: aadhaarFileType,
          aadhaar_file_name: aadhaarFileName,
          pan_number: panNumber,
          pan_file: panFile,
          pan_file_type: panFileType,
          pan_file_name: panFileName,
          upi_id: upiId,
          wallet_number: walletNumber,
          account_number: accountNumber,
          ifsc,
          bank_name: bankName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "OTP भेजने में विफल।");
      }

      setStatusMsg(data.message);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "पंजीकरण में त्रुटि।");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Complete Registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    if (otpCode.length < 6) {
      setErrorMsg("कृपया 6-अंकीय OTP दर्ज करें।");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_register",
          email,
          otp: otpCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "सत्यापन विफल रहा।");
      }

      setStatusMsg("पंजीकरण सफल! सदस्य डैशबोर्ड खोला जा रहा है...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || "OTP अमान्य है।");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSettings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">पंजीकरण स्थिति की जांच हो रही है...</p>
        </div>
      </div>
    );
  }

  if (linkActive === false) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-slate-200 animate-scale-in glass-panel">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-black uppercase tracking-wider">
              पंजीकरण बंद (Registration Disabled)
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              सदस्य आमंत्रण लिंक निष्क्रिय है
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              एडमिन द्वारा नए सदस्यों का पंजीकरण वर्तमान में <b>अस्थायी रूप से बंद (Disabled)</b> कर दिया गया है। जब एडमिन इस लिंक को पुनः चालू करेंगे तभी आप अपना विवरण भरकर ग्रुप में जुड़ सकेंगे।
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>होम पेज पर वापस जाएं</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition hover-lift"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>होम पेज पर वापस जाएं</span>
          </Link>
          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full animate-float">
            DFI सदस्य आमंत्रण पोर्टल
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6 hover-lift transition-all">
          <div className="text-center space-y-2 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
              DFI
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              DFI इमरजेंसी सेवा - सदस्य स्वयं पंजीकरण
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              कृपया अपनी जानकारी भरें। आपके ईमेल पर आए OTP सत्यापन के बाद आप सीधे ग्रुप में जुड़
              जाएंगे।
            </p>
          </div>

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

          {step === 1 ? (
            /* Step 1: Member Form */
            <form onSubmit={handleSendOtp} className="space-y-5 text-xs">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  1. व्यक्तिगत जानकारी
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">पूरा नाम *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="उदा. राहुल शर्मा"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">मोबाइल नंबर *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ईमेल आईडी (लॉगिन हेतु) *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    * सत्यापन OTP इसी ईमेल पर भेजा जाएगा।
                  </p>
                </div>
              </div>

              {/* Photo */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  2. सदस्य फोटो (Live Camera या File Upload) *
                </label>
                {cameraActive ? (
                  <div className="space-y-2">
                    <video ref={videoRef} className="w-full max-w-sm aspect-video rounded-xl object-cover bg-black mx-auto" autoPlay playsInline />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex justify-center gap-2">
                      <button type="button" onClick={capturePhoto} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">
                        फोटो खींचें (Auto-Compressed)
                      </button>
                      <button type="button" onClick={stopCamera} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold">
                        रद्द करें
                      </button>
                    </div>
                  </div>
                ) : photo ? (
                  <div className="flex items-center gap-3">
                    <img src={photo} alt="Selfie" className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-sm" />
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> फोटो सफलतापूर्वक जोड़ी गई
                      </span>
                      <button type="button" onClick={() => setPhoto("")} className="text-xs text-rose-600 font-bold hover:underline block">
                        फोटो हटाएं
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={startCamera} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition">
                      <Camera className="w-4 h-4" />
                      <span>लाइव कैमरा से फोटो लें *</span>
                    </button>
                    <label className="px-4 py-2 bg-white border border-slate-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>गैलरी से चुनें *</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const compressed = await compressImage(f, { maxWidth: 360, maxHeight: 360, quality: 0.7 });
                            setPhoto(compressed);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Aadhaar & PAN */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  3. आधार व पैन कार्ड दस्तावेज (अनिवार्य / Mandatory) *
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block font-bold text-slate-700">आधार संख्या (12 अंक) *</label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456789012"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="block text-slate-600 text-[11px] font-semibold cursor-pointer hover:text-blue-600 transition">
                      आधार दस्तावेज (PDF/JPG) *: <span className="text-blue-700 font-bold">{aadhaarFileName || "फाइल अपलोड करें"}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, setAadhaarFile, setAadhaarFileType, setAadhaarFileName);
                        }}
                      />
                    </label>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block font-bold text-slate-700">पैन संख्या (10 अंक) *</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="block text-slate-600 text-[11px] font-semibold cursor-pointer hover:text-blue-600 transition">
                      पैन दस्तावेज (PDF/JPG) *: <span className="text-blue-700 font-bold">{panFileName || "फाइल अपलोड करें"}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, setPanFile, setPanFileType, setPanFileName);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  4. डिजिटल भुगतान विवरण (UPI, PhonePe या बैंक खाता)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="name@upi"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">PhonePe / GPay नंबर</label>
                    <input
                      type="tel"
                      value={walletNumber}
                      onChange={(e) => setWalletNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">बैंक खाता संख्या</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="खाता नंबर"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">IFSC कोड</label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="SBIN0001234"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
              >
                {loading ? "OTP भेजा जा रहा है..." : "OTP प्राप्त करें व आगे बढ़ें (Next)"}
              </button>
            </form>
          ) : (
            /* Step 2: Verify OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    ईमेल पर आया 6-अंकीय OTP दर्ज करें
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    विवरण बदलें
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
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  OTP आपके ईमेल ({email}) पर भेजा गया है। इनबॉक्स या स्पैम फोल्डर देखें।
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/25 transition disabled:opacity-50"
              >
                {loading ? "सत्यापित किया जा रहा है..." : "सत्यापित करें व ग्रुप से जुड़ें"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
