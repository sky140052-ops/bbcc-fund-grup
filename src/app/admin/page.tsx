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
  DollarSign,
  Send,
  Sliders,
  Check,
  HelpCircle,
  X,
  FileCheck,
  Image as ImageIcon,
  Lock,
  Unlock,
  Calendar,
  ToggleLeft,
  ToggleRight,
  QrCode,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Member, Contribution, Loan, SystemSettings } from "../../lib/types";
import { compressImage } from "../../lib/compress";

export default function AdminPage() {
  const router = useRouter();

  // Active Tab: "status" | "members" | "add_member" | "transactions" | "loans"
  const [activeTab, setActiveTab] = useState<
    "status" | "members" | "add_member" | "transactions" | "loans"
  >("status");

  // Admin Profile & Integrations Status
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
  const [formEmail, setFormEmail] = useState("");
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

  // Transactions / Contributions States
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [totalPool, setTotalPool] = useState(0);

  // Loans States
  const [loans, setLoans] = useState<Loan[]>([]);
  const [disburseModalLoan, setDisburseModalLoan] = useState<Loan | null>(null);
  const [disburseUtr, setDisburseUtr] = useState("");
  const [disburseScreenshot, setDisburseScreenshot] = useState("");
  const [disburseNotes, setDisburseNotes] = useState("");
  const [disbursing, setDisbursing] = useState(false);
  const [disburseMsg, setDisburseMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Screenshot viewer modal
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  // Invite Link & Keep-Alive URL
  const [inviteLink, setInviteLink] = useState("");
  const [keepAliveUrl, setKeepAliveUrl] = useState("");

  // System Settings & Date Controls States
  const [settings, setSettings] = useState<SystemSettings>({
    _id: "dfi_system_settings",
    registration_link_active: true,
    allow_deposit_after_10th: false,
    allow_loan_repay_after_15th: false,
    updated_at: "",
  });
  const [currentDay, setCurrentDay] = useState<number>(new Date().getDate());
  const [updatingSettingKey, setUpdatingSettingKey] = useState<string | null>(null);
  const [settingUpdateMsg, setSettingUpdateMsg] = useState<string | null>(null);

  // Direct UPI & QR Code Settings State
  const [adminUpiInput, setAdminUpiInput] = useState("sky140052@okaxis");
  const [adminUpiNameInput, setAdminUpiNameInput] = useState("DFI इमरजेंसी सेवा");
  const [adminQrCodeInput, setAdminQrCodeInput] = useState("");
  const [savingUpiSettings, setSavingUpiSettings] = useState(false);
  const [upiSettingsMsg, setUpiSettingsMsg] = useState<string | null>(null);

  // Monthly Contribution Customization State
  const [monthlyAmountInput, setMonthlyAmountInput] = useState<number>(100);
  const [platformFeeInput, setPlatformFeeInput] = useState<number>(3);
  const [savingMonthlyAmount, setSavingMonthlyAmount] = useState<boolean>(false);
  const [monthlyAmountMsg, setMonthlyAmountMsg] = useState<string | null>(null);

  const [payLink, setPayLink] = useState("");
  const [loanApplyLink, setLoanApplyLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteLink(`${window.location.origin}/join`);
      setPayLink(`${window.location.origin}/pay`);
      setLoanApplyLink(`${window.location.origin}/loan-apply`);
      setKeepAliveUrl(`${window.location.origin}/api/keep-alive`);
    }
  }, []);

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.admin_upi_id) setAdminUpiInput(data.settings.admin_upi_id);
          if (data.settings.admin_upi_name) setAdminUpiNameInput(data.settings.admin_upi_name);
          if (data.settings.admin_qr_code) setAdminQrCodeInput(data.settings.admin_qr_code);
          if (typeof data.settings.monthly_contribution_amount === "number") {
            setMonthlyAmountInput(data.settings.monthly_contribution_amount);
          }
          if (typeof data.settings.platform_fee === "number") {
            setPlatformFeeInput(data.settings.platform_fee);
          }
        }
        if (typeof data.currentDay === "number") {
          setCurrentDay(data.currentDay);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  // Save Monthly Contribution Amount & Maintenance Fee (Lock & Save)
  const handleSaveMonthlyAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyAmountInput || monthlyAmountInput <= 0) {
      alert("कृपया मान्य अंशदान राशि दर्ज करें (कम से कम ₹1)।");
      return;
    }
    const fee = Number(platformFeeInput) >= 0 ? Number(platformFeeInput) : 0;
    setSavingMonthlyAmount(true);
    setMonthlyAmountMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_contribution_amount: Number(monthlyAmountInput),
          platform_fee: fee,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "मासिक अंशदान व शुल्क लॉक करने में विफल।");
      setSettings(data.settings);
      const feeText = fee === 0 ? "शुल्क मुफ़्त (₹0)" : `+₹${fee} शुल्क`;
      setMonthlyAmountMsg(`✓ मासिक अंशदान ₹${monthlyAmountInput} (${feeText} = कुल देय ₹${Number(monthlyAmountInput) + fee}) सफलतापूर्वक लॉक व सेव कर दिया गया!`);
      setTimeout(() => setMonthlyAmountMsg(null), 4500);
    } catch (err: any) {
      alert(err.message || "त्रुटि हुई।");
    } finally {
      setSavingMonthlyAmount(false);
    }
  };

  // Toggle Setting
  const handleToggleSetting = async (key: keyof SystemSettings, currentVal: boolean) => {
    setUpdatingSettingKey(key);
    setSettingUpdateMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !currentVal }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "सेटिंग्स अपडेट करने में विफल।");
      }
      setSettings(data.settings);
      setSettingUpdateMsg("सेटिंग सफलतापूर्वक अपडेट हो गई!");
      setTimeout(() => setSettingUpdateMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || "त्रुटि हुई।");
    } finally {
      setUpdatingSettingKey(null);
    }
  };

  // Save Direct UPI and QR Code Settings
  const handleSaveUpiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUpiSettings(true);
    setUpiSettingsMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_upi_id: adminUpiInput.trim(),
          admin_upi_name: adminUpiNameInput.trim(),
          admin_qr_code: adminQrCodeInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "UPI सेटिंग्स सेव करने में विफल।");
      setSettings(data.settings);
      setUpiSettingsMsg("✓ UPI एवं QR कोड सेटिंग्स सफलतापूर्वक सुरक्षित हो गईं!");
      setTimeout(() => setUpiSettingsMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || "त्रुटि हुई।");
    } finally {
      setSavingUpiSettings(false);
    }
  };

  // Upload Admin QR Code Photo (Auto-compressed)
  const handleAdminQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
      setAdminQrCodeInput(compressed);
    } catch {
      alert("QR कोड लोड करने में विफल।");
    }
  };

  // Approve Member Contribution (Deposit)
  const handleApproveContribution = async (id: string) => {
    try {
      const res = await fetch("/api/contributions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contribution_id: id, action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "स्वीकार करने में त्रुटि।");
      alert(data.message || "अंशदान स्वीकृत!");
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || "त्रुटि आई।");
    }
  };

  // Reject Member Contribution
  const handleRejectContribution = async (id: string) => {
    const reason = prompt("अस्वीकार करने का कारण दर्ज करें (वैकल्पिक):", "अमान्य स्क्रीनशॉट");
    if (reason === null) return;
    try {
      const res = await fetch("/api/contributions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contribution_id: id, action: "reject", reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "अस्वीकार करने में त्रुटि।");
      alert(data.message || "अंशदान अस्वीकृत!");
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || "त्रुटि आई।");
    }
  };

  // Approve Loan Repayment
  const handleApproveLoanRepay = async (loanId: string) => {
    if (!confirm("क्या आप इस सदस्य का लोन चुकता प्रमाण स्वीकार करना चाहते हैं?")) return;
    try {
      const res = await fetch("/api/loans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loan_id: loanId, action: "admin_approve_repayment" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "स्वीकार करने में विफल।");
      alert(data.message || "लोन चुकता स्वीकृत!");
      fetchLoans();
    } catch (err: any) {
      alert(err.message || "त्रुटि आई।");
    }
  };

  // Calculate Remaining Hours until 24h Auto-Approval
  const calcHoursRemaining = (submittedAt?: string) => {
    if (!submittedAt) return "24 घंटे";
    const diffMs = 24 * 60 * 60 * 1000 - (Date.now() - new Date(submittedAt).getTime());
    if (diffMs <= 0) return "0 घंटे (स्वतः स्वीकृत)";
    const hours = Math.ceil(diffMs / (60 * 60 * 1000));
    return `${hours} घंटे शेष`;
  };

  // Initial Fetch
  useEffect(() => {
    fetchAdminStatus();
    fetchMembers();
    fetchTransactions();
    fetchLoans();
    fetchSettings();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2000);
  };

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

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/contributions");
      if (res.ok) {
        const data = await res.json();
        setContributions(data.contributions || []);
        setTotalPool(data.total_community_pool || 0);
      }
    } catch (err) {
      console.error("Transactions fetch error:", err);
    }
  };

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/loans");
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans || []);
      }
    } catch (err) {
      console.error("Loans fetch error:", err);
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

  // Test Email Service OTP (from .env.local)
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
        setEmailTestResult(`🟢 ${data.message} (Test OTP: ${data.test_otp})`);
      } else {
        setEmailTestResult(`🔴 ${data.error || "ईमेल भेजने में विफल।"}`);
      }
    } catch {
      setEmailTestResult("🔴 सर्वर से संपर्क नहीं हो सका।");
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
        setFormPhoto(compressed);
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

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!formName.trim()) {
      setFormMsg({ type: "error", text: "कृपया सदस्य का नाम दर्ज करें।" });
      return;
    }
    if (!formEmail.trim() || !formEmail.includes("@")) {
      setFormMsg({ type: "error", text: "कृपया सदस्य का वैध ईमेल (Gmail) आईडी दर्ज करें।" });
      return;
    }
    if (formMobile.replace(/\D/g, "").length < 10) {
      setFormMsg({ type: "error", text: "कृपया 10-अंकीय मोबाइल नंबर दर्ज करें।" });
      return;
    }
    const cleanAadhaar = formAadhaarNumber.replace(/\D/g, "");
    if (cleanAadhaar.length !== 12) {
      setFormMsg({ type: "error", text: "कृपया 12-अंकों का आधार कार्ड नंबर दर्ज करें।" });
      return;
    }
    const cleanPan = formPanNumber.trim().toUpperCase();
    if (cleanPan && cleanPan.length < 10) {
      setFormMsg({ type: "error", text: "कृपया 10-अंकों का वैध पैन कार्ड नंबर दर्ज करें अथवा इसे खाली छोड़ें।" });
      return;
    }
    if (!formUpiId.trim() && (!formAccountNumber.trim() || !formIfsc.trim()) && !formWalletNumber.trim()) {
      setFormMsg({ type: "error", text: "कृपया बैंक खाता/IFSC, UPI आईडी या फोनपे/जीपे वॉलेट नंबर दर्ज करें।" });
      return;
    }

    setSubmittingMember(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
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

      // Reset
      setFormName("");
      setFormEmail("");
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

      fetchMembers();
      setTimeout(() => {
        setActiveTab("members");
        setFormMsg(null);
      }, 1500);
    } catch (err: any) {
      setFormMsg({ type: "error", text: err.message || "त्रुटि हुई।" });
    } finally {
      setSubmittingMember(false);
    }
  };

  // Open Edit
  const openEditModal = (member: Member) => {
    setEditMember(member);
    setEditForm({ ...member });
    setEditMsg(null);
  };

  // Save Edit
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

      setEditMsg({ type: "success", text: "सदस्य विवरण अपडेट हो गया!" });
      fetchMembers(searchQuery);
      setTimeout(() => {
        setEditMember(null);
      }, 1000);
    } catch (err: any) {
      setEditMsg({ type: "error", text: err.message || "समस्या आई।" });
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

  // Open Disbursal Modal for Loan
  const openDisburseModal = (loan: Loan) => {
    setDisburseModalLoan(loan);
    setDisburseUtr("");
    setDisburseScreenshot("");
    setDisburseNotes("");
    setDisburseMsg(null);
  };

  // Confirm Disbursal with Screenshot
  const handleConfirmDisbursal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseModalLoan) return;

    if (!disburseScreenshot) {
      setDisburseMsg({ type: "error", text: "कृपया सदस्य को भेजे गए पैसे का स्क्रीनशॉट प्रमाण संलग्न करें।" });
      return;
    }

    setDisbursing(true);
    setDisburseMsg(null);

    try {
      const res = await fetch("/api/loans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: disburseModalLoan._id,
          action: "admin_disburse",
          transaction_utr: disburseUtr,
          payment_screenshot: disburseScreenshot,
          admin_notes: disburseNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "लोन डिस्बर्सल विफल रहा।");
      }

      setDisburseMsg({ type: "success", text: data.message });
      fetchLoans();
      setTimeout(() => {
        setDisburseModalLoan(null);
      }, 1200);
    } catch (err: any) {
      setDisburseMsg({ type: "error", text: err.message || "त्रुटि हुई।" });
    } finally {
      setDisbursing(false);
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
            <span className="text-xs text-slate-500 font-semibold">• आपातकालीन सेवा कंट्रोल रूम</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            DFI प्रशासनिक डैशबोर्ड (Admin Portal)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Brevo ईमेल API, Razorpay गेटवे, सदस्य KYC, जमा लेन-देन व लोन डिस्बर्सल
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/api/admin/export?type=all"
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm hover-lift active-press"
            title="सदस्य, जमा लेन-देन और लोन का पूरा डेटा एक्सेल फाइल में डाउनलोड करें"
          >
            <Download className="w-3.5 h-3.5" />
            <span>एक्सेल फाइल डाउनलोड (.xlsx)</span>
          </a>

          <button
            onClick={() => {
              fetchAdminStatus();
              fetchMembers(searchQuery);
              fetchTransactions();
              fetchLoans();
              fetchSettings();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm hover-lift active-press"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>रिफ्रेश</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-sm hover-lift active-press"
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "status"
              ? "bg-white text-blue-700 shadow-md shadow-slate-300/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>सिस्टम कनेक्शन (Brevo & Razorpay)</span>
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "add_member"
              ? "bg-white text-blue-700 shadow-md shadow-slate-300/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>नया सदस्य जोड़ें</span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "transactions"
              ? "bg-white text-blue-700 shadow-md shadow-slate-300/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>जमा लेन-देन (₹{totalPool})</span>
        </button>

        <button
          onClick={() => setActiveTab("loans")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "loans"
              ? "bg-white text-blue-700 shadow-md shadow-slate-300/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>लोन अप्रूवल व डिस्बर्सल ({loans.filter((l) => l.status === "pending").length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SYSTEM INTEGRATIONS (BREVO & RAZORPAY)             */}
      {/* ======================================================== */}
      {activeTab === "status" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin Profile */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                मास्टर एडमिन प्रोफाइल
              </span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center">
                  SA
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{adminData?.name || "DFI एडमिन"}</h3>
                  <p className="text-xs text-slate-500 font-mono">{adminData?.email}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                डेटाबेस: <span className="font-bold text-emerald-600">Astra DB Serverless</span>
              </div>
            </div>

            {/* Email OTP Service Status - 100% Automatic from .env.local */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  ईमेल OTP सेवा API
                </span>
                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${emailData?.connected ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{emailData?.connected ? "सक्रिय (Active)" : "असक्रिय"}</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{emailData?.details}</p>
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {testingEmail ? "OTP भेजा जा रहा है..." : "ईमेल कनेक्शन टेस्ट करें"}
                </button>
                {emailTestResult && (
                  <div className="p-2 rounded-lg bg-blue-50 text-[11px] font-semibold text-blue-900 break-words">
                    {emailTestResult}
                  </div>
                )}
              </div>
            </div>

            {/* Direct UPI & QR Code Settings Form (Replaces Razorpay Gateway) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Direct UPI व QR कोड सेटिंग्स
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  0% कमीशन • सीधा बैंक
                </span>
              </div>

              <form onSubmit={handleSaveUpiSettings} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    आपका UPI ID (PhonePe/GPay)
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUpiInput}
                    onChange={(e) => setAdminUpiInput(e.target.value)}
                    placeholder="sky140052@okaxis"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    खाताधारक / ग्रुप नाम
                  </label>
                  <input
                    type="text"
                    value={adminUpiNameInput}
                    onChange={(e) => setAdminUpiNameInput(e.target.value)}
                    placeholder="DFI इमरजेंसी सेवा"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    QR कोड फ़ोटो अपलोड करें (वैकल्पिक)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAdminQrUpload}
                    className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {adminQrCodeInput && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={adminQrCodeInput} alt="QR Preview" className="w-12 h-12 object-contain rounded-lg border border-slate-200" />
                      <span className="text-[10px] text-emerald-600 font-bold">✓ QR कोड लगा हुआ है</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={savingUpiSettings}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {savingUpiSettings ? "सेव हो रहा है..." : "UPI सेटिंग्स सेव करें"}
                </button>

                {upiSettingsMsg && (
                  <p className="text-[11px] text-emerald-700 font-bold text-center">
                    {upiSettingsMsg}
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Row: System Date & Access Control Center */}
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-300 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-black uppercase tracking-wider">
                    मास्टर टाइमिंग व एक्सेस कंट्रोल
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    • आज: <b className="text-slate-900">{currentDay} तारीख</b>
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  सिस्टम कंट्रोल व तारीख सेटिंग्स (Date & Access Controls)
                </h3>
                <p className="text-xs text-slate-500">
                  सदस्य आमंत्रण लिंक, 10 तारीख के बाद जमा अनुमति, व 15 तारीख के बाद लोन चुकता अनुमति को यहाँ से नियंत्रित करें
                </p>
              </div>

              {settingUpdateMsg && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{settingUpdateMsg}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Control 1: Registration Link */}
              <div className={`p-5 rounded-2xl border transition-all ${
                settings.registration_link_active
                  ? "bg-emerald-50/60 border-emerald-300 shadow-sm"
                  : "bg-slate-50 border-slate-200"
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    कंट्रोल 1
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                    settings.registration_link_active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}>
                    {settings.registration_link_active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>पंजीकरण चालू</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-rose-600" />
                        <span>पंजीकरण बंद</span>
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">सदस्य पंजीकरण लिंक (/join)</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    जब आप इसे <b>सक्रिय (Active)</b> रखेंगे तभी कोई नया सदस्य लिंक से खुद रजिस्टर हो सकेगा। बंद करने पर लिंक लॉक हो जाता है।
                  </p>
                </div>

                <button
                  onClick={() => handleToggleSetting("registration_link_active", settings.registration_link_active)}
                  disabled={updatingSettingKey === "registration_link_active"}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                    settings.registration_link_active
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  } disabled:opacity-50`}
                >
                  {updatingSettingKey === "registration_link_active" ? (
                    "बदलाव हो रहा है..."
                  ) : settings.registration_link_active ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>लिंक बंद करें (Deactivate)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>लिंक चालू करें (Activate)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Control 2: Monthly Deposit After 10th */}
              <div className={`p-5 rounded-2xl border transition-all ${
                settings.allow_deposit_after_10th
                  ? "bg-blue-50/60 border-blue-300 shadow-sm"
                  : "bg-slate-50 border-slate-200"
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    कंट्रोल 2
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                    settings.allow_deposit_after_10th
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {settings.allow_deposit_after_10th ? "विशेष अनुमति चालू" : "1-10 केवल (डिफ़ॉल्ट)"}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">10 तारीख के बाद जमा अनुमति</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    सामान्यतः जमा बटन केवल <b>1 से 10 तारीख</b> तक दिखता है। 10 तारीख के बाद यदि किसी सदस्य से जमा लेना हो, तो इसे <b>चालू</b> करें।
                  </p>
                </div>

                <button
                  onClick={() => handleToggleSetting("allow_deposit_after_10th", settings.allow_deposit_after_10th)}
                  disabled={updatingSettingKey === "allow_deposit_after_10th"}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                    settings.allow_deposit_after_10th
                      ? "bg-slate-800 hover:bg-slate-900 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } disabled:opacity-50`}
                >
                  {updatingSettingKey === "allow_deposit_after_10th" ? (
                    "बदलाव हो रहा है..."
                  ) : settings.allow_deposit_after_10th ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>10 के बाद जमा बंद करें (डिफ़ॉल्ट नियम)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>10 के बाद भी जमा अनुमति दें (Enable)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Control 3: Loan Repayment After 15th */}
              <div className={`p-5 rounded-2xl border transition-all ${
                settings.allow_loan_repay_after_15th
                  ? "bg-indigo-50/60 border-indigo-300 shadow-sm"
                  : "bg-slate-50 border-slate-200"
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    कंट्रोल 3
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                    settings.allow_loan_repay_after_15th
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {settings.allow_loan_repay_after_15th ? "विशेष अनुमति चालू" : "15 तक केवल (डिफ़ॉल्ट)"}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">15 तारीख के बाद लोन चुकता अनुमति</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    लोन चुकता बटन केवल <b>15 तारीख तक</b> दिखता है। 15 तारीख के बाद किसी सदस्य का लोन क्लियर कराने के लिए इसे <b>चालू</b> करें।
                  </p>
                </div>

                <button
                  onClick={() => handleToggleSetting("allow_loan_repay_after_15th", settings.allow_loan_repay_after_15th)}
                  disabled={updatingSettingKey === "allow_loan_repay_after_15th"}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                    settings.allow_loan_repay_after_15th
                      ? "bg-slate-800 hover:bg-slate-900 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  } disabled:opacity-50`}
                >
                  {updatingSettingKey === "allow_loan_repay_after_15th" ? (
                    "बदलाव हो रहा है..."
                  ) : settings.allow_loan_repay_after_15th ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>15 के बाद लोन चुकता बंद करें (डिफ़ॉल्ट)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>15 के बाद भी लोन चुकता अनुमति दें (Enable)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Control 4: Monthly Deposit Customization & Manual Platform Fee */}
              <div className="p-5 rounded-2xl border bg-amber-50/70 border-amber-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    कंट्रोल 4
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" />
                    <span>अंशदान व शुल्क लॉक</span>
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">मासिक अंशदान एवं मेंटेनेंस शुल्क</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    हर महीने सदस्य कितना अंशदान जमा करेंगे और मेंटेनेंस शुल्क (₹0 मुफ़्त, ₹3, ₹5 या कोई भी) कितना रहेगा यहाँ से सेट करें।
                  </p>
                </div>

                <form onSubmit={handleSaveMonthlyAmount} className="space-y-3 pt-1">
                  {/* Field 1: Monthly Deposit Base */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      मूल मासिक बचत अंशदान (₹):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={monthlyAmountInput}
                        onChange={(e) => setMonthlyAmountInput(Number(e.target.value))}
                        placeholder="100"
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-amber-300 rounded-xl text-sm font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Field 2: Platform / Maintenance Fee (Manual input + Free preset) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        मेंटेनेंस / प्लेटफ़ॉर्म शुल्क (₹):
                      </label>
                      <span className="text-[10px] font-bold text-slate-500">
                        {Number(platformFeeInput) === 0 ? "🎉 मुफ़्त (Free)" : `+₹${platformFeeInput}`}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={platformFeeInput}
                        onChange={(e) => setPlatformFeeInput(Math.max(0, Number(e.target.value)))}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-amber-300 rounded-xl text-sm font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setPlatformFeeInput(0)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition border ${
                          Number(platformFeeInput) === 0
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        }`}
                      >
                        ₹0 (मुफ़्त)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlatformFeeInput(3)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition border ${
                          Number(platformFeeInput) === 3
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-blue-800 border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        ₹3 (डिफ़ॉल्ट)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlatformFeeInput(5)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition border ${
                          Number(platformFeeInput) === 5
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-indigo-800 border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        ₹5
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlatformFeeInput(10)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition border ${
                          Number(platformFeeInput) === 10
                            ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                            : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        ₹10
                      </button>
                    </div>
                  </div>

                  {/* Calculation Preview Box */}
                  <div className="p-2.5 bg-white/95 rounded-xl border border-amber-200 text-[11px] space-y-1.5 font-medium text-slate-700 shadow-sm">
                    <div className="flex justify-between">
                      <span>मूल बचत अंशदान (जमा):</span>
                      <span className="font-bold text-emerald-700">₹{monthlyAmountInput || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>प्लेटफ़ॉर्म मेंटेनेंस शुल्क:</span>
                      <span className={`font-bold ${Number(platformFeeInput) === 0 ? "text-emerald-600" : "text-blue-700"}`}>
                        {Number(platformFeeInput) === 0 ? "₹0 (मुफ़्त - कोई शुल्क नहीं)" : `+₹${platformFeeInput || 0}`}
                      </span>
                    </div>
                    <div className="border-t border-amber-200 pt-1 flex justify-between font-black text-slate-900">
                      <span>सदस्यों को कुल देय:</span>
                      <span className="text-amber-700 text-sm">
                        ₹{(Number(monthlyAmountInput) || 0) + (Number(platformFeeInput) || 0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 italic pt-0.5 leading-snug">
                      * सदस्य फंड खाते में केवल मूल राशि (₹{monthlyAmountInput || 0}) क्रेडिट होगी। {Number(platformFeeInput) > 0 ? `₹${platformFeeInput} मेंटेनेंस शुल्क फंड में नहीं जुड़ेगा।` : "मेंटेनेंस शुल्क मुफ़्त है।"}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={savingMonthlyAmount}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active-press"
                  >
                    {savingMonthlyAmount ? (
                      "सेव व लॉक हो रहा है..."
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>राशि व शुल्क लॉक व सेव करें (Lock & Save)</span>
                      </>
                    )}
                  </button>

                  {monthlyAmountMsg && (
                    <p className="text-[11px] text-emerald-700 font-bold text-center animate-pulse pt-1">
                      {monthlyAmountMsg}
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Row 2: Shareable Links Hub (Payment /pay, Loan Apply /loan-apply, Join /join, Anti-Sleep) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Card A: Shareable Payment Link (/pay) */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>सदस्य भुगतान लिंक (Shareable Payment Link - /pay)</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  24h Auto-Approve
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                यह लिंक WhatsApp पर सदस्यों को भेजें। सदस्य इस लिंक को खोलकर अपना नाम चुनेंगे, एडमिन UPI/QR कोड पर <b>₹{(settings.monthly_contribution_amount || 100) + (settings.platform_fee !== undefined ? settings.platform_fee : 3)} (मूल अंशदान ₹{settings.monthly_contribution_amount || 100} {(settings.platform_fee !== undefined ? settings.platform_fee : 3) > 0 ? `+ ₹${settings.platform_fee !== undefined ? settings.platform_fee : 3} मेंटेनेंस शुल्क` : "• शुल्क मुफ़्त"})</b> या <b>लोन किश्त</b> का भुगतान करेंगे और स्क्रीनशॉट अपलोड करेंगे। (एडमिन बिना ही 24 घंटे में स्वतः स्वीकृत):
              </p>
              <div className="p-3 bg-white border border-emerald-200 rounded-xl text-xs font-mono font-bold text-slate-800 break-all select-all">
                {payLink || "https://your-site/pay"}
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => handleCopy(payLink, "भुगतान लिंक")}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs shadow-sm transition"
                >
                  <Copy className="w-4 h-4" />
                  <span>लिंक कॉपी करें</span>
                </button>
                <button
                  onClick={() => {
                    const monthlyBase = settings.monthly_contribution_amount || 100;
                    const fee = settings.platform_fee !== undefined ? settings.platform_fee : 3;
                    const totalPay = monthlyBase + fee;
                    const feeLabel = fee === 0 ? "शुल्क मुफ़्त" : `+₹${fee} मेंटेनेंस शुल्क`;
                    const msg = `नमस्ते! DFI इमरजेंसी सेवा ग्रुप - मासिक अंशदान ₹${totalPay} (मूल बचत ₹${monthlyBase} • ${feeLabel}) अथवा लोन किश्त जमा करने हेतु कृपया नीचे दिए गए लिंक पर क्लिक करें और स्क्रीनशॉट अपलोड करें:\n${payLink}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
                  }}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp शेयर</span>
                </button>
                <button
                  onClick={() => window.open(payLink, "_blank")}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition"
                  title="पेज खोलें"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card B: Shareable Loan Apply Link (/loan-apply) */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span>लोन आवेदन लिंक (Shareable Loan Apply Link - /loan-apply)</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                  1% मासिक ब्याज
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                यह लिंक सदस्यों को भेजें। सदस्य अपना <b>12-अंकीय आधार नंबर</b> दर्ज करके अपनी कुल संचित बचत, 90% लोन पात्रता देख सकेंगे और 1% ब्याज दर पर तुरंत लोन आवेदन कर सकेंगे:
              </p>
              <div className="p-3 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-800 break-all select-all">
                {loanApplyLink || "https://your-site/loan-apply"}
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => handleCopy(loanApplyLink, "लोन आवेदन लिंक")}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-purple-300 hover:bg-purple-50 text-purple-800 font-bold rounded-xl text-xs shadow-sm transition"
                >
                  <Copy className="w-4 h-4" />
                  <span>लिंक कॉपी करें</span>
                </button>
                <button
                  onClick={() => {
                    const msg = `नमस्ते! DFI इमरजेंसी सेवा ग्रुप - 1% ब्याज पर लोन प्राप्त करने हेतु कृपया इस लिंक पर क्लिक कर अपना आधार नंबर दर्ज करें और आवेदन करें:\n${loanApplyLink}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
                  }}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp शेयर</span>
                </button>
                <button
                  onClick={() => window.open(loanApplyLink, "_blank")}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition"
                  title="पेज खोलें"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Invite Member Link Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700">
                  सदस्य आमंत्रण लिंक (Shareable Self-Add Link)
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  settings.registration_link_active ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                }`}>
                  {settings.registration_link_active ? "सक्रिय (Active)" : "निष्क्रिय (Disabled)"}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                यह लिंक किसी को भी WhatsApp या SMS पर भेजें। सदस्य इस लिंक को खोलकर अपना नाम,
                आधार व बैंक विवरण भरकर <b>स्वयं ग्रुप से जुड़ सकते हैं</b>:
              </p>
              <div className="p-3 bg-white border border-blue-200 rounded-xl text-xs font-mono font-bold text-slate-800 break-all select-all">
                {inviteLink || "https://your-site/join"}
              </div>

              {/* Status & Quick Toggle */}
              <div className="p-3 bg-white/70 border border-blue-100 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">
                  वर्तमान स्थिति: <b className={settings.registration_link_active ? "text-emerald-700" : "text-rose-700"}>
                    {settings.registration_link_active ? "पंजीकरण चालू है" : "पंजीकरण बंद है"}
                  </b>
                </span>
                <button
                  onClick={() => handleToggleSetting("registration_link_active", settings.registration_link_active)}
                  disabled={updatingSettingKey === "registration_link_active"}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg transition ${
                    settings.registration_link_active
                      ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {settings.registration_link_active ? "लिंक बंद करें" : "लिंक चालू करें"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => handleCopy(inviteLink, "आमंत्रण लिंक")}
                  className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 font-bold rounded-xl text-xs shadow-sm transition"
                >
                  <Copy className="w-4 h-4" />
                  <span>लिंक कॉपी करें</span>
                </button>
                <button
                  onClick={() => {
                    const msg = `नमस्ते! DFI इमरजेंसी सेवा ग्रुप में जुड़ने के लिए कृपया इस लिंक पर क्लिक करके अपना विवरण भरें:\n${inviteLink}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
                  }}
                  className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp पर भेजें</span>
                </button>
              </div>
            </div>

            {/* Anti-Sleep Keep-Alive Card */}
            <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  वेबसाइट स्लीप मोड प्रिवेंशन (Anti-Sleep Mode)
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>24/7 सक्रिय</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Render का फ्री सर्वर 15 मिनट बाद स्लीप हो जाता है। वेबसाइट को <b>24 घंटे लगातार बिना सोए चालू रखने</b> के लिए
                नीचे दिया गया URL फ्री टूल (<a href="https://cron-job.org" target="_blank" className="text-blue-600 underline font-bold">cron-job.org</a> या <a href="https://uptimerobot.com" target="_blank" className="text-blue-600 underline font-bold">UptimeRobot</a>) में डालकर हर 5 या 10 मिनट का पिंग सेट करें:
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 break-all select-all">
                {keepAliveUrl || "https://your-site/api/keep-alive"}
              </div>
              <button
                onClick={() => handleCopy(keepAliveUrl, "Keep-Alive URL")}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition"
              >
                <Copy className="w-4 h-4" />
                <span>Keep-Alive URL कॉपी करें</span>
              </button>
            </div>
          </div>

          {/* Row 3: Excel Data Export Center */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 border-2 border-emerald-300 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider">
                    डेटा बैकअप व एक्सेल रिपोर्ट
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    • Microsoft Excel (.xlsx) कम्पेटिबल
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  DFI डेटा एक्सेल फाइल डाउनलोड केंद्र (Excel Export Center)
                </h3>
                <p className="text-xs text-slate-600">
                  सभी सदस्यों के विवरण, मासिक जमा लेन-देन, तथा लोन इतिहास को एक्सेल स्प्रेडशीट में सुरक्षित डाउनलोड करें
                </p>
              </div>

              <a
                href="/api/admin/export?type=all"
                download
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition hover-lift active-press"
              >
                <Download className="w-4 h-4" />
                <span>मास्टर एक्सेल फाइल (सभी 3 शीट्स एक साथ)</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Export Option 1: Members */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-2 hover-lift transition-all">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  शीट 1: सदस्य डायरेक्टरी
                </span>
                <h4 className="font-bold text-slate-900 text-sm">सभी सदस्य विवरण</h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  नाम, मोबाइल, ईमेल, आधार, पैन, बैंक खाता संख्या, IFSC, UPI व पंजीकरण तारीख
                </p>
                <a
                  href="/api/admin/export?type=members"
                  download
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>सदस्य एक्सेल डाउनलोड (.xlsx)</span>
                </a>
              </div>

              {/* Export Option 2: Transactions */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-2 hover-lift transition-all">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  शीट 2: जमा लेन-देन
                </span>
                <h4 className="font-bold text-slate-900 text-sm">मासिक जमा रिकॉर्ड्स</h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  सदस्य नाम, जमा तारीख, माह, ₹100 राशि, रेजरपे रेफरेंस ID व पेमेंट स्टेटस
                </p>
                <a
                  href="/api/admin/export?type=contributions"
                  download
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>लेन-देन एक्सेल डाउनलोड (.xlsx)</span>
                </a>
              </div>

              {/* Export Option 3: Loans */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-2 hover-lift transition-all">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  शीट 3: लोन व डिस्बर्सल
                </span>
                <h4 className="font-bold text-slate-900 text-sm">लोन एवं रिपेमेंट इतिहास</h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  आवेदन राशि, 10% कटौती, 1% p.m. ब्याज, बैंक UTR, स्टेटस व चुकता विवरण
                </p>
                <a
                  href="/api/admin/export?type=loans"
                  download
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>लोन इतिहास एक्सेल डाउनलोड (.xlsx)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MEMBER LIST & SEARCH                              */}
      {/* ======================================================== */}
      {activeTab === "members" && (
        <div className="space-y-6 animate-fade-in">
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
                placeholder="नाम, ईमेल, मोबाइल या आधार से खोजें..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const msg = `नमस्ते! DFI इमरजेंसी सेवा ग्रुप में जुड़ने के लिए कृपया इस लिंक पर क्लिक करके अपना फॉर्म भरें:\n${inviteLink}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
                }}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp पर लिंक भेजें</span>
              </button>

              <button
                onClick={() => handleCopy(inviteLink, "आमंत्रण लिंक")}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>लिंक कॉपी</span>
              </button>

              <a
                href="/api/admin/export?type=members"
                download
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-bold text-xs transition hover-lift active-press"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>सदस्य एक्सेल डाउनलोड (.xlsx)</span>
              </a>

              <button
                onClick={() => setActiveTab("add_member")}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>नया सदस्य जोड़ें</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[11px]">
                    <th className="py-3 px-4">सदस्य</th>
                    <th className="py-3 px-4">ईमेल व मोबाइल</th>
                    <th className="py-3 px-4">आधार व पैन</th>
                    <th className="py-3 px-4">UPI / खाता</th>
                    <th className="py-3 px-4 text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {m.photo ? (
                            <img
                              src={m.photo}
                              alt={m.name}
                              className="w-10 h-10 rounded-xl object-cover border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center">
                              {m.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-bold text-slate-900">{m.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <p className="font-bold text-slate-800">{m.mobile}</p>
                        <p className="text-[11px] text-slate-400">{m.email}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        <p>Aadhaar: {m.aadhaar_number ? `..${m.aadhaar_number.slice(-4)}` : "—"}</p>
                        <p>PAN: {m.pan_number || "—"}</p>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <p className="text-emerald-700 font-semibold">{m.upi_id || "—"}</p>
                        <p className="text-slate-500">{m.wallet_number || m.account_number || "—"}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewMember(m)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteMemberId(m._id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ADD NEW MEMBER                                     */}
      {/* ======================================================== */}
      {activeTab === "add_member" && (
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 hover-lift transition-all">
            <h2 className="text-xl font-black text-slate-900">नया सदस्य पंजीकृत करें</h2>
            {formMsg && (
              <div
                className={`p-4 rounded-xl text-xs font-bold ${
                  formMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800"
                }`}
              >
                {formMsg.text}
              </div>
            )}
            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">नाम *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="राहुल शर्मा"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ईमेल (लॉगिन हेतु) *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="member@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">मोबाइल नंबर *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono"
                  />
                </div>
              </div>

              {/* Photo */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">
                  सदस्य फोटो (Live Camera या File Upload) <span className="text-slate-400 font-normal text-xs">(वैकल्पिक / Optional)</span>
                </label>
                {cameraActive ? (
                  <div className="space-y-2">
                    <video ref={videoRef} className="w-64 aspect-video rounded-xl object-cover bg-black" autoPlay playsInline />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-2">
                      <button type="button" onClick={capturePhoto} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold">
                        फोटो लें (Auto-Compressed)
                      </button>
                      <button type="button" onClick={stopCamera} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold">
                        रद्द करें
                      </button>
                    </div>
                  </div>
                ) : formPhoto ? (
                  <div className="flex items-center gap-3">
                    <img src={formPhoto} alt="Captured" className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-sm" />
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> फोटो सफलतापूर्वक जोड़ी गई
                      </span>
                      <button type="button" onClick={() => setFormPhoto("")} className="text-rose-600 font-bold block hover:underline">हटाएं</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" onClick={startCamera} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
                      📸 कैमरा चालू करें
                    </button>
                    <label className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold cursor-pointer hover:bg-slate-50">
                      गैलरी से चुनें
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const compressed = await compressImage(f, { maxWidth: 360, maxHeight: 360, quality: 0.7 });
                            setFormPhoto(compressed);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Aadhaar & PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800">आधार संख्या (12 अंक) *</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={formAadhaarNumber}
                    onChange={(e) => setFormAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456789012"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <label className="block text-slate-600 cursor-pointer text-[11px] font-semibold hover:text-blue-600">
                    आधार फाइल (PDF/JPG) <span className="text-slate-400 font-normal">(वैकल्पिक)</span>: <span className="text-blue-700 font-bold">{formAadhaarFileName || "फाइल चुनें"}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, setFormAadhaarFile, setFormAadhaarFileType, setFormAadhaarFileName);
                      }}
                    />
                  </label>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800">पैन संख्या (10 अंक) <span className="text-slate-400 font-normal text-xs">(वैकल्पिक / Optional)</span></label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formPanNumber}
                    onChange={(e) => setFormPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <label className="block text-slate-600 cursor-pointer text-[11px] font-semibold hover:text-blue-600">
                    पैन फाइल (PDF/JPG) <span className="text-slate-400 font-normal">(वैकल्पिक)</span>: <span className="text-blue-700 font-bold">{formPanFileName || "फाइल चुनें"}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, setFormPanFile, setFormPanFileType, setFormPanFileName);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={formUpiId}
                    onChange={(e) => setFormUpiId(e.target.value)}
                    placeholder="name@upi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PhonePe/GPay नंबर</label>
                  <input
                    type="tel"
                    value={formWalletNumber}
                    onChange={(e) => setFormWalletNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">बैंक खाता संख्या</label>
                  <input
                    type="text"
                    value={formAccountNumber}
                    onChange={(e) => setFormAccountNumber(e.target.value)}
                    placeholder="A/C Number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingMember}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submittingMember ? "सेव हो रहा है..." : "सदस्य सुरक्षित जोड़ें"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TRANSACTIONS / CONTRIBUTIONS                      */}
      {/* ======================================================== */}
      {activeTab === "transactions" && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">कुल जमा फंड</h3>
              <p className="text-xs text-slate-500">सभी सदस्यों द्वारा जमा कुल राशि</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-emerald-600">₹{totalPool}</span>
              <a
                href="/api/admin/export?type=contributions"
                download
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition hover-lift active-press"
              >
                <Download className="w-3.5 h-3.5" />
                <span>लेन-देन एक्सेल डाउनलोड (.xlsx)</span>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[11px]">
                    <th className="py-3 px-4">सदस्य</th>
                    <th className="py-3 px-4">तारीख</th>
                    <th className="py-3 px-4">माह</th>
                    <th className="py-3 px-4">राशि</th>
                    <th className="py-3 px-4">स्क्रीनशॉट प्रमाण</th>
                    <th className="py-3 px-4">स्थिति / 24h ऑटो-अप्रूवल</th>
                    <th className="py-3 px-4 text-right">एडमिन एक्शन</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contributions.map((c) => (
                    <tr key={c._id}>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>{c.member_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.member_mobile}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(c.paid_at || c.submitted_at || Date.now()).toLocaleString("hi-IN")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{c.month}</td>
                      <td className="py-3 px-4 font-black text-emerald-600">₹{c.amount}</td>
                      <td className="py-3 px-4">
                        {c.payment_screenshot ? (
                          <button
                            onClick={() => setPreviewScreenshot(c.payment_screenshot!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition text-xs"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>प्रमाण देखें</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {c.status === "paid" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            स्वीकृत {c.auto_approved ? "(24h स्वतः)" : "(एडमिन द्वारा)"}
                          </span>
                        ) : c.status === "pending" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                            ⏳ लंबित ({calcHoursRemaining(c.submitted_at)})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            अस्वीकृत
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {c.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveContribution(c._id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                            >
                              स्वीकारें
                            </button>
                            <button
                              onClick={() => handleRejectContribution(c._id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition"
                            >
                              अस्वीकारें
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">पूर्ण</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: LOANS APPROVAL & DISBURSAL                        */}
      {/* ======================================================== */}
      {activeTab === "loans" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  लोन आवेदन एवं डिस्बर्सल प्रबंधन
                </h3>
                <p className="text-xs text-slate-500">
                  सदस्यों के 90% लोन आवेदन, 10% प्रोसेसिंग फीस कटौती, पैसा भेजने के बाद स्क्रीनशॉट प्रूफ संलग्न करें।
                </p>
              </div>
              <a
                href="/api/admin/export?type=loans"
                download
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition hover-lift active-press shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>लोन इतिहास एक्सेल डाउनलोड (.xlsx)</span>
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[11px]">
                    <th className="py-3 px-4">सदस्य</th>
                    <th className="py-3 px-4">आवेदन राशि</th>
                    <th className="py-3 px-4">10% फीस</th>
                    <th className="py-3 px-4">भेजने योग्य राशि (90%)</th>
                    <th className="py-3 px-4">UPI / भुगतान नंबर</th>
                    <th className="py-3 px-4">स्थिति</th>
                    <th className="py-3 px-4 text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.map((l) => (
                    <tr key={l._id}>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{l.member_name}</p>
                        <p className="text-[10px] text-slate-400">{l.member_mobile}</p>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">₹{l.requested_amount}</td>
                      <td className="py-3 px-4 font-bold text-rose-600">-₹{l.processing_fee_amount}</td>
                      <td className="py-3 px-4 font-black text-emerald-600 text-sm">₹{l.disbursed_amount}</td>
                      <td className="py-3 px-4 text-[11px] font-mono">
                        {l.member_upi || l.member_wallet || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === "repaid"
                              ? "bg-emerald-100 text-emerald-800"
                              : l.status === "disbursed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {l.status === "repaid" ? "Repaid" : l.status === "disbursed" ? "चालू (Disbursed)" : "लंबित"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {l.status === "pending" ? (
                          <button
                            onClick={() => openDisburseModal(l)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>पैसा भेजें व स्क्रीनशॉट डालें</span>
                          </button>
                        ) : l.repayment_status === "pending_approval" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {l.repayment_screenshot && (
                              <button
                                onClick={() => setPreviewScreenshot(l.repayment_screenshot!)}
                                className="text-xs text-blue-600 font-bold hover:underline"
                              >
                                चुकता प्रमाण
                              </button>
                            )}
                            <button
                              onClick={() => handleApproveLoanRepay(l._id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                            >
                              स्वीकारें
                            </button>
                          </div>
                        ) : l.payment_screenshot ? (
                          <button
                            onClick={() => setPreviewScreenshot(l.payment_screenshot!)}
                            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 ml-auto"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>स्क्रीनशॉट देखें</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DISBURSE LOAN WITH SCREENSHOT PROOF               */}
      {/* ======================================================== */}
      {disburseModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-scale-in glass-panel">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                लोन डिस्बर्सल एवं पेमेंट स्क्रीनशॉट अपलोड
              </h3>
              <button onClick={() => setDisburseModalLoan(null)} className="text-xs text-slate-400 hover:text-slate-600">
                ✕ बंद करें
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <p><b>सदस्य:</b> {disburseModalLoan.member_name} ({disburseModalLoan.member_mobile})</p>
              <p><b>UPI / PhonePe:</b> {disburseModalLoan.member_upi || disburseModalLoan.member_wallet || "—"}</p>
              <p><b>कुल आवेदन:</b> ₹{disburseModalLoan.requested_amount}</p>
              <p className="text-rose-600"><b>10% प्रोसेसिंग फीस:</b> -₹{disburseModalLoan.processing_fee_amount}</p>
              <p className="text-emerald-700 font-bold text-sm">
                <b>सदस्य को भेजने योग्य शुद्ध राशि:</b> ₹{disburseModalLoan.disbursed_amount}
              </p>
            </div>

            {disburseMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  disburseMsg.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                }`}
              >
                {disburseMsg.text}
              </div>
            )}

            <form onSubmit={handleConfirmDisbursal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ट्रांजेक्शन UTR / रेफरेंस नंबर
                </label>
                <input
                  type="text"
                  required
                  value={disburseUtr}
                  onChange={(e) => setDisburseUtr(e.target.value)}
                  placeholder="उदा. UTR123456789"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  पेमेंट स्क्रीनशॉट प्रमाण (Screenshot Proof) *
                </label>
                {disburseScreenshot ? (
                  <div className="space-y-2">
                    <img src={disburseScreenshot} alt="Screenshot" className="max-h-40 rounded-xl border object-contain mx-auto" />
                    <button type="button" onClick={() => setDisburseScreenshot("")} className="text-xs text-rose-600 font-bold block mx-auto">
                      स्क्रीनशॉट बदलें
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-500 font-semibold">
                    <span>स्क्रीनशॉट फोटो चुनें (JPEG/PNG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const compressed = await compressImage(f, { maxWidth: 1000, maxHeight: 1000, quality: 0.75 });
                          setDisburseScreenshot(compressed);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={disbursing}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition disabled:opacity-50"
              >
                {disbursing ? "पुष्टि की जा रही है..." : "पुष्टि करें व लोन चालू करें (Confirm)"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW MEMBER DETAILS                               */}
      {/* ======================================================== */}
      {viewMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200 animate-scale-in glass-panel max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">सदस्य प्रोफाइल व दस्तावेज</h3>
              <button
                onClick={() => setViewMember(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {viewMember.photo ? (
                <img
                  src={viewMember.photo}
                  alt={viewMember.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-700 font-black text-2xl flex items-center justify-center shrink-0">
                  {viewMember.name.charAt(0)}
                </div>
              )}
              <div>
                <h4 className="text-xl font-black text-slate-900">{viewMember.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">📞 {viewMember.mobile}</p>
                <p className="text-xs text-slate-500 font-mono">✉️ {viewMember.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">आधार नंबर</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {viewMember.aadhaar_number || "—"}
                </span>
                {viewMember.aadhaar_file && (
                  <div className="mt-2">
                    <a
                      href={viewMember.aadhaar_file}
                      download={viewMember.aadhaar_file_name || "aadhaar_doc"}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>आधार फाइल डाउनलोड</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">पैन कार्ड नंबर</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {viewMember.pan_number || "—"}
                </span>
                {viewMember.pan_file && (
                  <div className="mt-2">
                    <a
                      href={viewMember.pan_file}
                      download={viewMember.pan_file_name || "pan_doc"}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>पैन फाइल डाउनलोड</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">UPI / Wallet</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {viewMember.upi_id || viewMember.wallet_number || "—"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">बैंक खाता व IFSC</span>
                <span className="font-mono font-bold text-slate-900 text-sm block">
                  {viewMember.account_number || "—"}
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {viewMember.bank_name ? `${viewMember.bank_name} • ` : ""}
                  {viewMember.ifsc || ""}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewMember(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT MEMBER DETAILS                               */}
      {/* ======================================================== */}
      {editMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-200 animate-scale-in glass-panel max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">सदस्य विवरण एडिट करें</h3>
              <button
                onClick={() => setEditMember(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  editMsg.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                {editMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">नाम *</label>
                <input
                  type="text"
                  required
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ईमेल (लॉगिन हेतु) *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">मोबाइल नंबर *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editForm.mobile || ""}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">आधार नंबर (12 अंक)</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={editForm.aadhaar_number || ""}
                    onChange={(e) => setEditForm({ ...editForm, aadhaar_number: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">पैन कार्ड नंबर (10 अंक/अक्षर)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editForm.pan_number || ""}
                    onChange={(e) => setEditForm({ ...editForm, pan_number: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <label className="block font-bold text-slate-700 mb-1">PhonePe / Google Pay Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editForm.wallet_number || ""}
                    onChange={(e) => setEditForm({ ...editForm, wallet_number: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">बैंक खाता नंबर</label>
                  <input
                    type="text"
                    value={editForm.account_number || ""}
                    onChange={(e) => setEditForm({ ...editForm, account_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC कोड</label>
                  <input
                    type="text"
                    value={editForm.ifsc || ""}
                    onChange={(e) => setEditForm({ ...editForm, ifsc: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">बैंक नाम</label>
                  <input
                    type="text"
                    value={editForm.bank_name || ""}
                    onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditMember(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={updatingMember}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50"
                >
                  {updatingMember ? "अपडेट हो रहा है..." : "विवरण सेव करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE CONFIRMATION                               */}
      {/* ======================================================== */}
      {deleteMemberId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-center animate-scale-in glass-panel">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">सदस्य को हटाएं?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                क्या आप वाकई इस सदस्य को हटाना चाहते हैं? यह कार्रवाई अपरिवर्तनीय है।
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setDeleteMemberId(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                रद्द करें
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-md transition disabled:opacity-50"
              >
                {deleting ? "हटाया जा रहा है..." : "हाँ, हटाएं"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Zoom Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scale-in glass-panel">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">लोन भुगतान स्क्रीनशॉट प्रमाण</h4>
              <button onClick={() => setPreviewScreenshot(null)} className="text-xs text-slate-500 font-bold">
                बंद करें ✕
              </button>
            </div>
            <img src={previewScreenshot} alt="Payment Proof" className="max-h-[70vh] w-full object-contain rounded-2xl bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}
