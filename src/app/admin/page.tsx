"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  UserPlus,
  Search,
  Camera,
  Upload,
  FileText,
  CreditCard,
  Building,
  Phone,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Mail,
  Copy,
  Download,
  ExternalLink,
  Zap,
  Sliders,
  Check,
  HelpCircle,
  ChevronRight,
  X,
  FileCheck,
} from "lucide-react";
import { Member } from "../../lib/types";

export default function AdminPage() {
  const router = useRouter();

  // Active Tab: "status" | "members" | "add_member"
  const [activeTab, setActiveTab] = useState<"status" | "members" | "add_member">("status");

  // Auth & Admin Status
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [razorpayData, setRazorpayData] = useState<any>(null);
  const [emailData, setEmailData] = useState<any>(null);
  const [databaseData, setDatabaseData] = useState<any>(null);

  // Diagnostic Test states
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<string | null>(null);
  const [testingRazorpay, setTestingRazorpay] = useState(false);
  const [razorpayTestResult, setRazorpayTestResult] = useState<string | null>(null);

  // Members List states
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Modals
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add Member Form States
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formPhoto, setFormPhoto] = useState<string>("");
  const [formAadhaarNumber, setFormAadhaarNumber] = useState("");
  const [formAadhaarFile, setFormAadhaarFile] = useState<string>("");
  const [formAadhaarFileType, setFormAadhaarFileType] = useState<"pdf" | "image">("image");
  const [formAadhaarFileName, setFormAadhaarFileName] = useState("");
  const [formPanNumber, setFormPanNumber] = useState("");
  const [formPanFile, setFormPanFile] = useState<string>("");
  const [formPanFileType, setFormPanFileType] = useState<"pdf" | "image">("image");
  const [formPanFileName, setFormPanFileName] = useState("");
  const [formUpiId, setFormUpiId] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formIfsc, setFormIfsc] = useState("");
  const [formBankName, setFormBankName] = useState("");
  const [formWalletNumber, setFormWalletNumber] = useState("");
  const [submittingMember, setSubmittingMember] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Camera WebCam States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Edit Form States
  const [editForm, setEditForm] = useState<Partial<Member>>({});
  const [updatingMember, setUpdatingMember] = useState(false);
  const [editMsg, setEditMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Initial Fetch
  useEffect(() => {
    fetchAdminStatus();
    fetchMembers();
  }, []);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Fetch Admin Profile & Integrations Status
  const fetchAdminStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/admin/status");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAdminData(data.admin);
        setRazorpayData(data.razorpay);
        setEmailData(data.email);
        setDatabaseData(data.database);
      }
    } catch (err) {
      console.error("Status fetch error:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Fetch Members List
  const fetchMembers = async (q: string = "") => {
    setLoadingMembers(true);
    try {
      const url = q ? `/api/admin/members?q=${encodeURIComponent(q)}` : "/api/admin/members";
      const res = await fetch(url);
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error("Members fetch error:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Test Razorpay Connection
  const handleTestRazorpay = async () => {
    setTestingRazorpay(true);
    setRazorpayTestResult(null);
    try {
      const res = await fetch("/api/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_razorpay" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRazorpayTestResult(data.message || "Razorpay API सफलता से कनेक्ट हो गई!");
      } else {
        setRazorpayTestResult(data.error || "Razorpay टेस्ट विफल रहा।");
      }
    } catch {
      setRazorpayTestResult("सर्वर से संपर्क नहीं हो सका।");
    } finally {
      setTestingRazorpay(false);
    }
  };

  // Test Email Service OTP
  const handleTestEmail = async () => {
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await fetch("/api/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_email" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailTestResult(`${data.message} (Test OTP: ${data.test_otp})`);
      } else {
        setEmailTestResult(data.error || "ईमेल भेजने में विफल।");
      }
    } catch {
      setEmailTestResult("सर्वर से संपर्क नहीं हो सका।");
    } finally {
      setTestingEmail(false);
    }
  };

  // Camera Management
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
    } catch (err) {
      alert("कैमरा चालू करने की अनुमति नहीं मिली या कैमरा उपलब्ध नहीं है।");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setFormPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  // File Upload Helper (converts to base64 and detects pdf vs image)
  const handleFileUpload = (
    file: File,
    setFile: (base64: string) => void,
    setType: (t: "pdf" | "image") => void,
    setName: (n: string) => void
  ) => {
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    setType(isPdf ? "pdf" : "image");
    setName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFile(result);
    };
    reader.readAsDataURL(file);
  };

  // Add Member Submit
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!formName.trim()) {
      setFormMsg({ type: "error", text: "कृपया सदस्य का नाम दर्ज करें।" });
      return;
    }
    if (formMobile.replace(/\D/g, "").length < 10) {
      setFormMsg({ type: "error", text: "कृपया 10-अंकों का वैध मोबाइल नंबर दर्ज करें।" });
      return;
    }

    setSubmittingMember(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          mobile: formMobile,
          photo: formPhoto,
          aadhaar_number: formAadhaarNumber,
          aadhaar_file: formAadhaarFile,
          aadhaar_file_type: formAadhaarFileType,
          aadhaar_file_name: formAadhaarFileName,
          pan_number: formPanNumber,
          pan_file: formPanFile,
          pan_file_type: formPanFileType,
          pan_file_name: formPanFileName,
          upi_id: formUpiId,
          account_number: formAccountNumber,
          ifsc: formIfsc,
          bank_name: formBankName,
          wallet_number: formWalletNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "सदस्य जोड़ने में त्रुटि।");
      }

      setFormMsg({ type: "success", text: `सदस्य ${formName} सफलतापूर्वक जुड़ गए हैं!` });

      // Reset form
      setFormName("");
      setFormMobile("");
      setFormPhoto("");
      setFormAadhaarNumber("");
      setFormAadhaarFile("");
      setFormPanNumber("");
      setFormPanFile("");
      setFormUpiId("");
      setFormAccountNumber("");
      setFormIfsc("");
      setFormBankName("");
      setFormWalletNumber("");

      // Refresh list & switch to list
      fetchMembers();
      setTimeout(() => {
        setActiveTab("members");
        setFormMsg(null);
      }, 1500);
    } catch (err: any) {
      setFormMsg({ type: "error", text: err.message || "सदस्य जोड़ने में त्रुटि हुई।" });
    } finally {
      setSubmittingMember(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (member: Member) => {
    setEditMember(member);
    setEditForm({ ...member });
    setEditMsg(null);
  };

  // Save Edit Member
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    setUpdatingMember(true);
    setEditMsg(null);

    try {
      const res = await fetch("/api/admin/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "अपडेट विफल रहा।");
      }

      setEditMsg({ type: "success", text: "सदस्य विवरण सफलतापूर्वक अपडेट हो गया!" });
      fetchMembers(searchQuery);
      setTimeout(() => {
        setEditMember(null);
      }, 1000);
    } catch (err: any) {
      setEditMsg({ type: "error", text: err.message || "अपडेट करने में समस्या।" });
    } finally {
      setUpdatingMember(false);
    }
  };

  // Delete Member
  const handleDeleteMember = async () => {
    if (!deleteMemberId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/members?id=${deleteMemberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers((prev) => prev.filter((m) => m._id !== deleteMemberId));
        setDeleteMemberId(null);
      } else {
        alert(data.error || "सदस्य हटाने में त्रुटि।");
      }
    } catch {
      alert("सर्वर त्रुटि।");
    } finally {
      setDeleting(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black tracking-wider">
              DFI MASTER ADMIN
            </span>
            <span className="text-xs text-slate-500 font-semibold">• सुरक्षित कंट्रोल रूम</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            DFI प्रशासनिक डैशबोर्ड (Admin Portal)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            सिस्टम स्थिति, Razorpay गेटवे, ईमेल OTP व सदस्य KYC प्रबंधन
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchAdminStatus();
              fetchMembers(searchQuery);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>रिफ्रेश</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-200/70 w-fit">
        <button
          onClick={() => setActiveTab("status")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "status"
              ? "bg-white text-blue-700 shadow-md shadow-slate-300/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>एडमिन प्रोफाइल व सिस्टम कनेक्शन</span>
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "members"
              ? "bg-white text-blue-700 shadow-md shadow-slate-300/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>सदस्य सूची ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("add_member")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "add_member"
              ? "bg-white text-blue-700 shadow-md shadow-slate-300/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>नया सदस्य जोड़ें (Add Member)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ADMIN PROFILE & INTEGRATIONS STATUS                */}
      {/* ======================================================== */}
      {activeTab === "status" && (
        <div className="space-y-6">
          {loadingStatus ? (
            <div className="py-12 text-center text-slate-500 font-semibold text-sm">
              सिस्टम स्थिति लोड हो रही है...
            </div>
          ) : (
            <>
              {/* Row 1: Profile & DB status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Admin Profile */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      एडमिन प्रोफाइल
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      सत्यापित
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                      SA
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base">
                        {adminData?.name || "DFI मुख्य एडमिन"}
                      </h3>
                      <p className="text-xs text-slate-500">{adminData?.role || "Master Administrator"}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">एडमिन ईमेल:</span>
                      <span className="font-bold text-slate-800 font-mono">{adminData?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">सुरक्षा मोड:</span>
                      <span className="font-bold text-emerald-600">Email OTP + JWT 30-Day</span>
                    </div>
                  </div>
                </div>

                {/* Razorpay Integration Card */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Razorpay गेटवे
                    </span>
                    {razorpayData?.connected ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>सक्रिय (Connected)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                        <XCircle className="w-3 h-3" />
                        <span>असक्रिय (Missing)</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Razorpay API Key</h4>
                      <p className="text-xs text-slate-500 font-mono">{razorpayData?.key_id_masked}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">मोड:</span>
                      <span className="font-bold text-slate-800">{razorpayData?.mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">API Secret:</span>
                      <span className="font-bold text-emerald-600">
                        {razorpayData?.has_secret ? "सुरक्षित रूप से लोड" : "अनुपलब्ध"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleTestRazorpay}
                    disabled={testingRazorpay || !razorpayData?.connected}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition disabled:opacity-50"
                  >
                    {testingRazorpay ? "जांच हो रही है..." : "Razorpay कनेक्शन टेस्ट करें"}
                  </button>

                  {razorpayTestResult && (
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-800">
                      {razorpayTestResult}
                    </div>
                  )}
                </div>

                {/* Email Service Status Card */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      ईमेल OTP सेवा
                    </span>
                    {emailData?.connected ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>सक्रिय (Connected)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>डिफ़ॉल्ट सिस्टम</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center font-bold">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">
                        {emailData?.provider === "gmail_smtp"
                          ? "Gmail SMTP (App Password)"
                          : emailData?.provider === "resend"
                          ? "Resend Email API"
                          : emailData?.provider === "brevo"
                          ? "Brevo SMTP API"
                          : "कोई प्रदाता सेट नहीं"}
                      </h4>
                      <p className="text-[11px] text-slate-500">{emailData?.details}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">दैनिक फ्री लिमिट:</span>
                      <span className="font-bold text-slate-800">
                        {emailData?.provider === "gmail_smtp"
                          ? "500 Emails/Day (Free)"
                          : emailData?.provider === "resend"
                          ? "3,000 Emails/Mo"
                          : emailData?.provider === "brevo"
                          ? "300 Emails/Day (Free)"
                          : "अनलिमिटेड कंसोल"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">OTP इनबॉक्स डिलीवरी:</span>
                      <span className="font-bold text-emerald-600">अत्यंत तीव्र (Ultra-Fast)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition disabled:opacity-50"
                  >
                    {testingEmail ? "OTP भेजा जा रहा है..." : "ईमेल OTP टेस्ट करें"}
                  </button>

                  {emailTestResult && (
                    <div className="mt-2.5 p-2 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-900">
                      {emailTestResult}
                    </div>
                  )}
                </div>
              </div>

              {/* Free Email Service Recommendation Guide */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
                <div className="max-w-3xl space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-300 text-xs font-bold">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>मुफ्त में ईमेल OTP भेजने का सबसे आसान तरीका (Free Email Setup)</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    बिना किसी डोमेन खरीदे, अपने पर्सनल Gmail से फ्री OTP कैसे भेजें?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Google हर Gmail यूजर को प्रतिदिन <b>500 फ्री ईमेल</b> भेजने की सुविधा देता है।
                    आपको सिर्फ अपने Google खाते से 16-अक्षरों का <b>App Password</b> जनरेट करना है:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                      <span className="font-bold text-blue-300 block mb-1">कदम 1: सुरक्षा खोलें</span>
                      myaccount.google.com &gt; Security &gt; 2-Step Verification को On करें।
                    </div>
                    <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                      <span className="font-bold text-blue-300 block mb-1">कदम 2: App Password बनाएं</span>
                      "App Passwords" सर्च करें, नाम "DFI" डालें और 16-अक्षरों का पासवर्ड कॉपी करें।
                    </div>
                    <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                      <span className="font-bold text-blue-300 block mb-1">कदम 3: Render में डालें</span>
                      Environment में <code className="text-yellow-300">SMTP_EMAIL</code> और{" "}
                      <code className="text-yellow-300">SMTP_PASSWORD</code> सेट कर दें!
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MEMBERS LIST & SEARCH                              */}
      {/* ======================================================== */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchMembers(e.target.value);
                }}
                placeholder="नाम, मोबाइल, आधार या पैन से खोजें..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <button
              onClick={() => setActiveTab("add_member")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>नया सदस्य जोड़ें</span>
            </button>
          </div>

          {/* Members Table */}
          {loadingMembers ? (
            <div className="py-16 text-center text-slate-500 font-semibold text-sm">
              सदस्य लोड किए जा रहे हैं...
            </div>
          ) : members.length === 0 ? (
            <div className="py-16 text-center p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">कोई सदस्य नहीं मिला</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                अभी तक कोई सदस्य नहीं जोड़ा गया है। ऊपर दिए गए "नया सदस्य जोड़ें" बटन से सदस्य को
                जोड़ें।
              </p>
              <button
                onClick={() => setActiveTab("add_member")}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>पहला सदस्य जोड़ें</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">सदस्य (Photo & Name)</th>
                      <th className="py-3.5 px-4">मोबाइल नंबर</th>
                      <th className="py-3.5 px-4">आधार संख्या व दस्तावेज</th>
                      <th className="py-3.5 px-4">पैन संख्या व दस्तावेज</th>
                      <th className="py-3.5 px-4">डिजिटल भुगतान (UPI/Bank/Wallet)</th>
                      <th className="py-3.5 px-4 text-right">कार्रवाई (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50/70 transition">
                        {/* Member Photo & Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {m.photo ? (
                              <img
                                src={m.photo}
                                alt={m.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-700 font-black flex items-center justify-center text-sm shadow-sm">
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                              <span className="text-[10px] text-slate-400">
                                जोड़ा गया: {new Date(m.created_at).toLocaleDateString("hi-IN")}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Mobile Number */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 font-mono">
                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                            <span>{m.mobile}</span>
                          </div>
                        </td>

                        {/* Aadhaar Number & Document */}
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-mono font-bold text-slate-800">
                              {m.aadhaar_number ? `XXXX-XXXX-${m.aadhaar_number.slice(-4)}` : "—"}
                            </p>
                            {m.aadhaar_file ? (
                              <button
                                onClick={() => setViewMember(m)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold hover:bg-blue-100 transition"
                              >
                                <FileCheck className="w-3 h-3" />
                                <span>{m.aadhaar_file_type === "pdf" ? "PDF संलग्न" : "JPEG फोटो संलग्न"}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">कोई फाइल नहीं</span>
                            )}
                          </div>
                        </td>

                        {/* PAN Number & Document */}
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-mono font-bold text-slate-800">
                              {m.pan_number || "—"}
                            </p>
                            {m.pan_file ? (
                              <button
                                onClick={() => setViewMember(m)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100 transition"
                              >
                                <FileCheck className="w-3 h-3" />
                                <span>{m.pan_file_type === "pdf" ? "PDF संलग्न" : "JPEG फोटो संलग्न"}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">कोई फाइल नहीं</span>
                            )}
                          </div>
                        </td>

                        {/* Payment Details */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            {m.upi_id && (
                              <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                                <span className="font-bold">UPI:</span> {m.upi_id}
                              </p>
                            )}
                            {m.account_number && (
                              <p className="text-[11px] font-mono text-slate-700">
                                A/C: {m.account_number} ({m.ifsc})
                              </p>
                            )}
                            {m.wallet_number && (
                              <p className="text-[11px] font-semibold text-blue-700">
                                PhonePe/GPay: {m.wallet_number}
                              </p>
                            )}
                            {!m.upi_id && !m.account_number && !m.wallet_number && (
                              <span className="text-slate-400 text-[11px]">दर्ज नहीं</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewMember(m)}
                              title="पूरा विवरण देखें"
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(m)}
                              title="संशोधित करें"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteMemberId(m._id)}
                              title="हटाएं"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ADD NEW MEMBER                                     */}
      {/* ======================================================== */}
      {activeTab === "add_member" && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                नया सदस्य पंजीकृत करें (Add New Member)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                सदस्य का नाम, लाइव फोटो/अपलोड, आधार व पैन कार्ड (PDF या JPEG) और डिजिटल भुगतान
                विवरण भरें।
              </p>
            </div>

            {formMsg && (
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm font-bold ${
                  formMsg.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-6">
              {/* Section 1: Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    सदस्य का पूरा नाम (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="उदा. राहुल शर्मा"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    मोबाइल नंबर (10-Digit Mobile) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Section 2: Photo (Live Camera or Upload) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      सदस्य की फोटो (Live Camera या File Upload)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      लाइव वेबकैम से तुरंत फोटो खींचें या डिवाइस से JPEG/PNG चुनें।
                    </p>
                  </div>
                  {formPhoto && (
                    <button
                      type="button"
                      onClick={() => setFormPhoto("")}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      फोटो हटाएं
                    </button>
                  )}
                </div>

                {/* Camera View Area */}
                {cameraActive ? (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden bg-black max-w-sm mx-auto aspect-video border-2 border-blue-500 shadow-md">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
                      >
                        📸 फोटो खींचें (Capture)
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
                      >
                        रद्द करें
                      </button>
                    </div>
                  </div>
                ) : formPhoto ? (
                  /* Captured Photo Preview */
                  <div className="flex items-center gap-4">
                    <img
                      src={formPhoto}
                      alt="Captured"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                    <div>
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>फोटो सफलता से संलग्न है</span>
                      </span>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="mt-2 text-xs font-bold text-blue-600 hover:underline block"
                      >
                        पुनः कैमरा से खींचें
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Photo Selector Buttons */
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>लाइव कैमरा से फोटो लें</span>
                    </button>

                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer shadow-sm transition">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>गैलरी / फाइल से चुनें</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setFormPhoto(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Section 3: Aadhaar Card (Number + PDF/JPEG file) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  आधार कार्ड विवरण (Aadhaar Number & Document)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      12-अंकीय आधार संख्या (Aadhaar Number)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={formAadhaarNumber}
                      onChange={(e) => setFormAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456789012"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      आधार कार्ड फाइल (PDF या JPEG/PNG)
                    </label>
                    <label className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition text-xs font-semibold">
                      <span className="truncate max-w-[200px] text-slate-700">
                        {formAadhaarFileName || "फाइल चुनें (PDF/JPG)"}
                      </span>
                      <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(
                              file,
                              setFormAadhaarFile,
                              setFormAadhaarFileType,
                              setFormAadhaarFileName
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 4: PAN Card (Number + PDF/JPEG file) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  पैन कार्ड विवरण (PAN Number & Document)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      10-अंकीय पैन संख्या (PAN Number)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formPanNumber}
                      onChange={(e) => setFormPanNumber(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      पैन कार्ड फाइल (PDF या JPEG/PNG)
                    </label>
                    <label className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition text-xs font-semibold">
                      <span className="truncate max-w-[200px] text-slate-700">
                        {formPanFileName || "फाइल चुनें (PDF/JPG)"}
                      </span>
                      <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(
                              file,
                              setFormPanFile,
                              setFormPanFileType,
                              setFormPanFileName
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 5: Payment Details (UPI, Bank, PhonePe/GPay) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  डिजिटल भुगतान विवरण (UPI, बैंक खाता या PhonePe/GPay)
                </h4>
                <p className="text-[11px] text-slate-500">
                  सदस्य के पैसे प्राप्त करने या भुगतान करने का कोई भी विवरण दर्ज करें।
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      UPI ID (जैसे: name@upi)
                    </label>
                    <input
                      type="text"
                      value={formUpiId}
                      onChange={(e) => setFormUpiId(e.target.value)}
                      placeholder="9876543210@paytm"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      PhonePe / GPay मोबाइल नंबर
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formWalletNumber}
                      onChange={(e) => setFormWalletNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      बैंक का नाम (Bank Name)
                    </label>
                    <input
                      type="text"
                      value={formBankName}
                      onChange={(e) => setFormBankName(e.target.value)}
                      placeholder="SBI / HDFC / PNB"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      बैंक खाता संख्या (Account Number)
                    </label>
                    <input
                      type="text"
                      value={formAccountNumber}
                      onChange={(e) => setFormAccountNumber(e.target.value)}
                      placeholder="0000123456789"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      IFSC कोड (IFSC Code)
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formIfsc}
                      onChange={(e) => setFormIfsc(e.target.value.toUpperCase())}
                      placeholder="SBIN0001234"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingMember}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
                >
                  {submittingMember ? (
                    <span>सदस्य डेटाबेस में सुरक्षित किया जा रहा है...</span>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>सदस्य को सुरक्षित जोड़ें (Save Member)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: VIEW MEMBER FULL DETAILS                         */}
      {/* ======================================================== */}
      {viewMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewMember(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
              {viewMember.photo ? (
                <img
                  src={viewMember.photo}
                  alt={viewMember.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-200 text-slate-700 font-black text-2xl flex items-center justify-center">
                  {viewMember.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-black text-slate-900">{viewMember.name}</h3>
                <p className="text-xs text-blue-600 font-bold font-mono mt-0.5">
                  📞 {viewMember.mobile}
                </p>
                <span className="text-[11px] text-slate-400 block mt-1">
                  आईडी: {viewMember._id} • पंजीकरण:{" "}
                  {new Date(viewMember.created_at).toLocaleString("hi-IN")}
                </span>
              </div>
            </div>

            {/* Document & Payment Sections */}
            <div className="space-y-6 text-xs">
              {/* Aadhaar Details & File Viewer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    आधार कार्ड (Aadhaar Card)
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {viewMember.aadhaar_number || "दर्ज नहीं"}
                  </span>
                </div>

                {viewMember.aadhaar_file ? (
                  <div className="mt-2 space-y-2">
                    {viewMember.aadhaar_file_type === "pdf" ? (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-6 h-6 text-rose-500" />
                          <div>
                            <p className="font-bold text-slate-800">
                              {viewMember.aadhaar_file_name || "Aadhaar_Document.pdf"}
                            </p>
                            <span className="text-[10px] text-slate-400">PDF दस्तावेज</span>
                          </div>
                        </div>
                        <a
                          href={viewMember.aadhaar_file}
                          download={viewMember.aadhaar_file_name || "Aadhaar_Doc.pdf"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>देखें / डाउनलोड</span>
                        </a>
                      </div>
                    ) : (
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <img
                          src={viewMember.aadhaar_file}
                          alt="Aadhaar Document"
                          className="w-full max-h-72 object-contain bg-slate-900"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">कोई आधार दस्तावेज अपलोड नहीं है।</p>
                )}
              </div>

              {/* PAN Details & File Viewer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    पैन कार्ड (PAN Card)
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {viewMember.pan_number || "दर्ज नहीं"}
                  </span>
                </div>

                {viewMember.pan_file ? (
                  <div className="mt-2 space-y-2">
                    {viewMember.pan_file_type === "pdf" ? (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-6 h-6 text-rose-500" />
                          <div>
                            <p className="font-bold text-slate-800">
                              {viewMember.pan_file_name || "PAN_Document.pdf"}
                            </p>
                            <span className="text-[10px] text-slate-400">PDF दस्तावेज</span>
                          </div>
                        </div>
                        <a
                          href={viewMember.pan_file}
                          download={viewMember.pan_file_name || "PAN_Doc.pdf"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>देखें / डाउनलोड</span>
                        </a>
                      </div>
                    ) : (
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <img
                          src={viewMember.pan_file}
                          alt="PAN Document"
                          className="w-full max-h-72 object-contain bg-slate-900"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">कोई पैन दस्तावेज अपलोड नहीं है।</p>
                )}
              </div>

              {/* Digital Payment Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  डिजिटल भुगतान विवरण (Payment Details)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* UPI */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">UPI ID</span>
                      <span className="font-bold text-slate-800">{viewMember.upi_id || "—"}</span>
                    </div>
                    {viewMember.upi_id && (
                      <button
                        onClick={() => handleCopy(viewMember.upi_id!, "UPI ID")}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* PhonePe / GPay */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">PhonePe / GPay नंबर</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {viewMember.wallet_number || "—"}
                      </span>
                    </div>
                    {viewMember.wallet_number && (
                      <button
                        onClick={() => handleCopy(viewMember.wallet_number!, "Wallet Number")}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Bank Account */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">
                        बैंक खाता संख्या ({viewMember.bank_name || "Bank"})
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {viewMember.account_number || "—"}
                      </span>
                    </div>
                    {viewMember.account_number && (
                      <button
                        onClick={() => handleCopy(viewMember.account_number!, "Account Number")}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* IFSC */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">IFSC कोड</span>
                      <span className="font-bold text-slate-800 font-mono uppercase">
                        {viewMember.ifsc || "—"}
                      </span>
                    </div>
                    {viewMember.ifsc && (
                      <button
                        onClick={() => handleCopy(viewMember.ifsc!, "IFSC")}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {copySuccess && (
                  <div className="text-center text-emerald-600 font-bold text-[11px] pt-1">
                    ✓ {copySuccess} कॉपी हो गया!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT MEMBER DETAILS                              */}
      {/* ======================================================== */}
      {editMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditMember(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">सदस्य जानकारी अपडेट करें</h3>
            <p className="text-xs text-slate-500 mb-6">
              नाम, फोटो, आधार/पैन संख्या, दस्तावेज या बैंक विवरण संशोधित करें।
            </p>

            {editMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold mb-4 ${
                  editMsg.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                {editMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">नाम</label>
                  <input
                    type="text"
                    required
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">मोबाइल नंबर</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editForm.mobile || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, mobile: e.target.value.replace(/\D/g, "") })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">आधार संख्या</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={editForm.aadhaar_number || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        aadhaar_number: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">पैन संख्या</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editForm.pan_number || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, pan_number: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={editForm.upi_id || ""}
                    onChange={(e) => setEditForm({ ...editForm, upi_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">PhonePe/GPay नंबर</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editForm.wallet_number || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        wallet_number: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">बैंक का नाम</label>
                  <input
                    type="text"
                    value={editForm.bank_name || ""}
                    onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">बैंक खाता संख्या</label>
                  <input
                    type="text"
                    value={editForm.account_number || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, account_number: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC कोड</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={editForm.ifsc || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, ifsc: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditMember(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={updatingMember}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50"
                >
                  {updatingMember ? "अपडेट हो रहा है..." : "बदलाव सुरक्षित करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION                              */}
      {/* ======================================================== */}
      {deleteMemberId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">सदस्य को स्थायी रूप से हटाएं?</h3>
            <p className="text-xs text-slate-500">
              यह कार्रवाई पूर्ववत नहीं की जा सकती। सदस्य की सभी फाइलें और रिकॉर्ड हटा दिए जाएंगे।
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteMemberId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                रद्द करें
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {deleting ? "हटाया जा रहा है..." : "हाँ, हटा दें"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
