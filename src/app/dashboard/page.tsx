"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  User,
  Users,
  CreditCard,
  FileText,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Eye,
  LogOut,
  RefreshCw,
  Phone,
  Building,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Lock,
  QrCode,
  Copy,
  Upload,
  X,
  Mail,
  Share2,
} from "lucide-react";
import { Member, Contribution, Loan, SystemSettings } from "../../lib/types";
import { compressImage } from "../../lib/compress";
import { performLogout } from "../../lib/clientLogout";

function MemberDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab: "my_fund" | "loan" | "my_profile" | "transparency"
  const [activeTab, setActiveTab] = useState<"my_fund" | "loan" | "my_profile" | "transparency">("my_fund");

  // Sync activeTab with URL search param "?tab=..."
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "loan" ||
      tabParam === "my_profile" ||
      tabParam === "transparency" ||
      tabParam === "my_fund"
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);

  // Contributions & Fund
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [myContributions, setMyContributions] = useState<Contribution[]>([]);
  const [communityPoolTotal, setCommunityPoolTotal] = useState(0);
  const [myTotalDeposited, setMyTotalDeposited] = useState(0);
  const [depositMsg, setDepositMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Direct UPI Screenshot Deposit Modal State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositScreenshot, setDepositScreenshot] = useState<string>("");
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  // Direct UPI Loan Repayment Modal State
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayScreenshot, setRepayScreenshot] = useState<string>("");
  const [submittingRepay, setSubmittingRepay] = useState(false);

  const [copiedUpi, setCopiedUpi] = useState(false);

  // Loans
  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [activeLoan, setActiveLoan] = useState<any>(null);
  const [loanAmountInput, setLoanAmountInput] = useState("");
  const [loanReasonInput, setLoanReasonInput] = useState("");
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanMsg, setLoanMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // All Members Directory
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  // Screenshot viewer modal
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  // System Settings & Date Controls
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [currentDay, setCurrentDay] = useState<number>(new Date().getDate());

  const adminUpi = systemSettings?.admin_upi_id || "sky140052@okaxis";
  const adminName = systemSettings?.admin_upi_name || "DFI इमरजेंसी सेवा";
  const monthlyDepositAmount = systemSettings?.monthly_contribution_amount || 100;
  const platformFee = systemSettings?.platform_fee !== undefined ? systemSettings.platform_fee : 3;
  const totalPayableAmount = monthlyDepositAmount + platformFee;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(adminUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Fetch Member Profile & Data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch current user/member (support persistent localStorage Bearer token)
      const localToken = typeof window !== "undefined" ? localStorage.getItem("dfi_token") : null;
      const headers: Record<string, string> = {};
      if (localToken) headers["Authorization"] = `Bearer ${localToken}`;

      const resMe = await fetch("/api/auth/me", { headers });
      if (resMe.status === 401) {
        router.push("/?open_login=true");
        return;
      }
      const dataMe = await resMe.json();
      if (!dataMe.authenticated) {
        router.push("/?open_login=true");
        return;
      }
      setMember(dataMe.user);

      // 2. Fetch Contributions
      const resContrib = await fetch("/api/contributions");
      if (resContrib.ok) {
        const dataContrib = await resContrib.json();
        setContributions(dataContrib.contributions || []);
        setMyContributions(dataContrib.member_contributions || []);
        setCommunityPoolTotal(dataContrib.total_community_pool || 0);
        setMyTotalDeposited(dataContrib.member_total_deposited || 0);
      }

      // 3. Fetch Loans
      const resLoans = await fetch("/api/loans");
      if (resLoans.ok) {
        const dataLoans = await resLoans.json();
        setAllLoans(dataLoans.loans || []);
        setMyLoans(dataLoans.member_loans || []);
        setActiveLoan(dataLoans.active_loan || null);
      }

      // 4. Fetch All Members for Community Transparency
      const resMembers = await fetch("/api/admin/members");
      if (resMembers.ok) {
        const dataMembers = await resMembers.json();
        setAllMembers(dataMembers.members || []);
      }

      // 5. Fetch System Settings & Current Date Window
      const resSettings = await fetch("/api/admin/settings");
      if (resSettings.ok) {
        const dataSettings = await resSettings.json();
        setSystemSettings(dataSettings.settings || null);
        if (typeof dataSettings.currentDay === "number") {
          setCurrentDay(dataSettings.currentDay);
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Instant Logout
  const handleLogout = async () => {
    await performLogout();
  };

  // Handle Screenshot Upload for Monthly Deposit (Auto-compressed)
  const handleDepositFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 1000, quality: 0.75 });
      setDepositScreenshot(compressed);
    } catch {
      alert("फ़ोटो लोड करने में त्रुटि। कृपया पुनः प्रयास करें।");
    }
  };

  // Submit Monthly Deposit Screenshot
  const handleSubmitDepositScreenshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositScreenshot) {
      alert("कृपया भुगतान का स्क्रीनशॉट अपलोड करें।");
      return;
    }

    setSubmittingDeposit(true);
    try {
      const localToken = typeof window !== "undefined" ? localStorage.getItem("dfi_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (localToken) headers["Authorization"] = `Bearer ${localToken}`;

      const res = await fetch("/api/contributions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: monthlyDepositAmount,
          payment_screenshot: depositScreenshot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "जमा स्क्रीनशॉट दर्ज करने में विफल।");
      }

      setDepositMsg({
        type: "success",
        text:
          data.message ||
          `₹${totalPayableAmount} (${
            platformFee > 0
              ? `मूल अंशदान ₹${monthlyDepositAmount} + ₹${platformFee} शुल्क`
              : `अंशदान ₹${monthlyDepositAmount} मुफ़्त शुल्क`
          }) का स्क्रीनशॉट दर्ज हो गया है! एडमिन द्वारा या 24 घंटे में स्वतः (Auto-Approve) आपके खाते में ₹${monthlyDepositAmount} जुड़ जाएगा।`,
      });
      setShowDepositModal(false);
      setDepositScreenshot("");
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "त्रुटि आई।");
    } finally {
      setSubmittingDeposit(false);
    }
  };

  // Handle Screenshot Upload for Loan Repay (Auto-compressed)
  const handleRepayFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 1000, quality: 0.75 });
      setRepayScreenshot(compressed);
    } catch {
      alert("फ़ोटो लोड करने में त्रुटि।");
    }
  };

  // Submit Loan Repayment Screenshot
  const handleSubmitRepayScreenshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoan) return;
    if (!repayScreenshot) {
      alert("कृपया भुगतान का स्क्रीनशॉट अपलोड करें।");
      return;
    }

    setSubmittingRepay(true);
    const totalPayable = activeLoan.total_payable || activeLoan.requested_amount;

    try {
      const localToken = typeof window !== "undefined" ? localStorage.getItem("dfi_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (localToken) headers["Authorization"] = `Bearer ${localToken}`;

      const res = await fetch("/api/loans", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          loan_id: activeLoan._id,
          action: "member_repay",
          amount: totalPayable,
          repayment_screenshot: repayScreenshot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "लोन चुकता स्क्रीनशॉट दर्ज करने में विफल।");
      }

      alert(data.message || "लोन चुकता स्क्रीनशॉट दर्ज हो गया! 24 घंटे में स्वतः (Auto-Approve) चुकता हो जाएगा।");
      setShowRepayModal(false);
      setRepayScreenshot("");
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "त्रुटि आई।");
    } finally {
      setSubmittingRepay(false);
    }
  };

  // Submit Loan Request (Up to Total Community Pool)
  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLoan(true);
    setLoanMsg(null);

    const amount = Number(loanAmountInput);
    const maxAllowed = communityPoolTotal;

    if (amount <= 0) {
      setLoanMsg({ type: "error", text: "कृपया मान्य लोन राशि दर्ज करें।" });
      setSubmittingLoan(false);
      return;
    }

    if (amount > maxAllowed) {
      setLoanMsg({
        type: "error",
        text: `आपकी अधिकतम लोन पात्रता ₹${maxAllowed} है (सभी सदस्यों द्वारा कुल जमा कम्युनिटी फंड के बराबर)।`,
      });
      setSubmittingLoan(false);
      return;
    }

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          reason: loanReasonInput || "आपातकालीन वित्तीय आवश्यकता",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "लोन आवेदन विफल रहा।");
      }

      setLoanMsg({ type: "success", text: data.message });
      setLoanAmountInput("");
      setLoanReasonInput("");
      fetchDashboardData();
    } catch (err: any) {
      setLoanMsg({ type: "error", text: err.message || "लोन आवेदन में समस्या आई।" });
    } finally {
      setSubmittingLoan(false);
    }
  };

  // Loan limit up to total community pool
  const maxLoanEligible = communityPoolTotal;

  // Recent disbursements & contributions for Slide 1 Social Proof feed
  const recentFeed = [
    ...allLoans
      .filter((l) => l.status === "disbursed" || l.status === "approved" || l.status === "repaid")
      .map((l) => ({
        id: l._id,
        name: l.member_name || "सदस्य",
        amount: l.requested_amount,
        tag: "लोन वितरण",
        date: l.disbursed_at || l.requested_at,
        photo: (l as any).member_photo,
      })),
    ...contributions
      .filter((c) => c.status === "paid")
      .map((c) => ({
        id: c._id,
        name: c.member_name || "सदस्य",
        amount: c.amount,
        tag: "सुरक्षित बचत",
        date: c.approved_at || c.submitted_at || c.paid_at,
        photo: null,
      })),
  ];

  const displayFeed =
    recentFeed.length > 0
      ? recentFeed.slice(0, 8)
      : [
          { id: "1", name: "मयूर माथुर", amount: 50000, tag: "लोन वितरण", photo: null },
          { id: "2", name: "नयना पाटिल", amount: 80000, tag: "लोन वितरण", photo: null },
          { id: "3", name: "प्रवीण कुमार", amount: 100000, tag: "लोन वितरण", photo: null },
          { id: "4", name: "राहुल शर्मा", amount: 50000, tag: "सुरक्षित बचत", photo: null },
        ];

  return (
    <div className="max-w-md mx-auto px-3.5 py-2.5 space-y-3 pb-24">
      {/* 1. Top Member Greeting Bar (Standard Native App Proportions) */}
      <div className="flex items-center justify-between px-1 py-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {member?.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              className="w-10 h-10 rounded-full object-cover border border-blue-400 shadow-2xs flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs flex-shrink-0">
              {member?.name ? member.name.charAt(0).toUpperCase() : "M"}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 truncate">
                नमस्ते, {member?.name?.split(" ")[0] || "सदस्य"} 🙏
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                सक्रिय
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              ID: {member?._id?.slice(-6)} • DFI आपातकालीन सुरक्षा
            </p>
          </div>
        </div>

        <button
          onClick={fetchDashboardData}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition active:scale-90 flex items-center gap-1"
          title="रिफ्रेश करें"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold hidden sm:inline">रिफ्रेश</span>
        </button>
      </div>

      {/* Navigation Tabs - Mobile Native Segmented Control */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/70 w-full">
        <button
          onClick={() => {
            setActiveTab("my_fund");
            router.replace("/dashboard?tab=my_fund", { scroll: false });
          }}
          className={`py-1.5 px-0.5 rounded-lg text-[10px] font-bold transition truncate text-center ${
            activeTab === "my_fund"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          होम
        </button>

        <button
          onClick={() => {
            setActiveTab("loan");
            router.replace("/dashboard?tab=loan", { scroll: false });
          }}
          className={`py-1.5 px-0.5 rounded-lg text-[10px] font-bold transition truncate text-center ${
            activeTab === "loan"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          लोन
        </button>

        <button
          onClick={() => {
            setActiveTab("my_profile");
            router.replace("/dashboard?tab=my_profile", { scroll: false });
          }}
          className={`py-1.5 px-0.5 rounded-lg text-[10px] font-bold transition truncate text-center ${
            activeTab === "my_profile"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          प्रोफाइल
        </button>

        <button
          onClick={() => {
            setActiveTab("transparency");
            router.replace("/dashboard?tab=transparency", { scroll: false });
          }}
          className={`py-1.5 px-0.5 rounded-lg text-[10px] font-bold transition truncate text-center ${
            activeTab === "transparency"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          समुदाय
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: HOME & ACTIVE FUND (Dedicated Screen)             */}
      {/* ======================================================== */}
      {activeTab === "my_fund" && (
        <div className="space-y-3.5 animate-fade-in">
          {/* 1. Hero Curved Banner: "Get money, when you need it" */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3.5 sm:p-4 shadow-md shadow-blue-500/15">
            {/* Decorative blur circle */}
            <div className="absolute -right-4 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between gap-2.5">
              <div className="space-y-1 max-w-[70%]">
                <span className="inline-block text-[10px] font-bold tracking-wide uppercase text-blue-200">
                  Get money, when you need it
                </span>
                <div className="text-[11px] text-blue-100 font-medium">
                  अधिकतम आपातकालीन लोन पात्रता
                </div>
                <div className="text-2xl font-black tracking-tight text-white my-0.5">
                  ₹ {maxLoanEligible.toLocaleString("en-IN")}
                </div>
                <div className="pt-0.5">
                  <button
                    onClick={() => {
                      setActiveTab("loan");
                      router.replace("/dashboard?tab=loan", { scroll: false });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-blue-700 hover:bg-blue-50 font-bold text-[11px] shadow-xs transition active:scale-95"
                  >
                    <span>तुरंत लोन लें (Get Now)</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Right Gold Money Graphic */}
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 border border-white/20 backdrop-blur-xs flex-shrink-0 text-center">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-900 flex items-center justify-center shadow-xs text-xl font-black">
                  💰
                </div>
                <span className="text-[9px] font-bold text-amber-200 mt-1">DFI सुरक्षा</span>
              </div>
            </div>
          </div>

          {/* 2. 4-Grid Quick Action Tiles */}
          <div className="grid grid-cols-4 gap-2 text-center py-0.5">
            {/* 1. Bank Balance / मासिक बचत */}
            <button
              onClick={() => {
                setActiveTab("my_fund");
                router.replace("/dashboard?tab=my_fund", { scroll: false });
              }}
              className="flex flex-col items-center justify-start group active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center shadow-2xs transition">
                <Building className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1.5 leading-tight">
                मासिक बचत
              </span>
              <span className="text-[9px] font-semibold text-blue-600">
                ₹{monthlyDepositAmount}
              </span>
            </button>

            {/* 2. Health Insurance / आकस्मिक लोन */}
            <button
              onClick={() => {
                setActiveTab("loan");
                router.replace("/dashboard?tab=loan", { scroll: false });
              }}
              className="flex flex-col items-center justify-start group active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs transition">
                <DollarSign className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1.5 leading-tight">
                आकस्मिक लोन
              </span>
              <span className="text-[9px] font-semibold text-rose-600">
                90% तुरंत
              </span>
            </button>

            {/* 3. Refer & Earn / पारदर्शिता डायरेक्टरी */}
            <button
              onClick={() => {
                setActiveTab("transparency");
                router.replace("/dashboard?tab=transparency", { scroll: false });
              }}
              className="flex flex-col items-center justify-start group active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs transition">
                <Users className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1.5 leading-tight">
                पारदर्शिता
              </span>
              <span className="text-[9px] font-semibold text-emerald-600">
                कम्युनिटी
              </span>
            </button>

            {/* 4. 24*7 Support / हेल्पलाइन */}
            <a
              href="https://wa.me/919140052000?text=नमस्ते%20DFI%20इमरजेंसी%20हेल्पलाइन"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-start group active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 group-hover:bg-amber-100 text-amber-600 flex items-center justify-center shadow-2xs transition">
                <Phone className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1.5 leading-tight">
                24*7 सहायता
              </span>
              <span className="text-[9px] font-semibold text-amber-600">
                हेल्पलाइन
              </span>
            </a>
          </div>

          {/* 3. Social Proof Feed: "Yesterday's loan disbursement" */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <div>
                <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                  Yesterday's loan disbursement
                </h2>
                <p className="text-[9px] text-slate-400">
                  100% पारदर्शी एवं सुरक्षित समुदाय फंड
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("transparency");
                  router.replace("/dashboard?tab=transparency", { scroll: false });
                }}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                <span>सभी देखें</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Horizontal Carousel of Activity Cards */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {displayFeed.map((item, idx) => (
                <div
                  key={idx}
                  className="w-28 flex-shrink-0 p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col items-center text-center space-y-1"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-white border border-slate-200 shadow-2xs flex items-center justify-center font-bold text-blue-600 text-xs">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      item.name.charAt(0)
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-slate-800 truncate w-full">
                    {item.name}
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Summary Cards (Standard App Size) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Card 1: Monthly Deposit Window */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  मासिक निर्धारित अंशदान
                </span>
                <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                  ((currentDay >= 1 && currentDay <= 10) || Boolean(systemSettings?.allow_deposit_after_10th))
                    ? "bg-white/20 text-white"
                    : "bg-rose-500 text-white"
                }`}>
                  {currentDay >= 1 && currentDay <= 10
                    ? "1-10 तारीख (सक्रिय)"
                    : systemSettings?.allow_deposit_after_10th
                    ? "एडमिन अनुमति द्वारा सक्रिय"
                    : "अवधि समाप्त (10 के बाद बंद)"}
                </span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black">₹{monthlyDepositAmount}</h3>
                <p className="text-[10px] text-blue-100 mt-0.5">
                  प्रति माह Direct UPI द्वारा देय{" "}
                  {platformFee > 0
                    ? `(+₹${platformFee} शुल्क = ₹${totalPayableAmount})`
                    : "(शुल्क मुफ़्त - ₹0)"}
                </p>
              </div>

              {((currentDay >= 1 && currentDay <= 10) || Boolean(systemSettings?.allow_deposit_after_10th)) ? (
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setDepositScreenshot("");
                      setShowDepositModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition shadow-xs active-press"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>₹{totalPayableAmount} जमा करें (QR / UPI)</span>
                  </button>
                  {currentDay > 10 && systemSettings?.allow_deposit_after_10th && (
                    <p className="text-[9px] text-emerald-200 font-bold text-center">
                      ★ एडमिन विशेष अनुमति द्वारा 10 के बाद भी सक्रिय
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-black/20 border border-white/10 space-y-0.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-200">
                    <Lock className="w-3 h-3" />
                    <span>जमा अवधि समाप्त (1-10 तारीख)</span>
                  </div>
                  <p className="text-[10px] text-blue-100 leading-snug">
                    आज {currentDay} तारीख है। एडमिन अनुमति पर ही खुलेगा।
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: My Total Deposited */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                मेरी कुल जमा राशि
              </span>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">₹{myTotalDeposited}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  कुल सफल अंशदान: {myContributions.length} महीने
                </p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>लोन पात्रता: ₹{maxLoanEligible} (कम्युनिटी फंड तक)</span>
              </div>
            </div>

            {/* Card 3: Community Total Pool */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                ग्रुप कुल जमा फंड (Community Pool)
              </span>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-600">₹{communityPoolTotal}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">सभी सदस्यों द्वारा कुल जमा राशि</p>
              </div>
              <div className="text-[10px] text-slate-500">
                सुरक्षित एवं पारदर्शी बचत • 100% सदस्यों के लिए उपलब्ध
              </div>
            </div>
          </div>

          {depositMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold ${
                depositMsg.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {depositMsg.text}
            </div>
          )}

          {/* Deposit History (Compact App View) */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs space-y-2">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              मेरा जमा इतिहास (My Deposit History)
            </h3>
            {myContributions.length === 0 ? (
              <div className="py-5 text-center text-slate-400 text-[11px]">
                आपने अभी तक कोई अंशदान जमा नहीं किया है। ऊपर दिए गए बटन से अपना पहला मासिक अंशदान (₹{totalPayableAmount}) जमा करें।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-2 px-2.5">तारीख</th>
                      <th className="py-2 px-2.5">माह</th>
                      <th className="py-2 px-2.5">जमा राशि</th>
                      <th className="py-2 px-2.5">स्क्रीनशॉट</th>
                      <th className="py-2 px-2.5">स्थिति</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myContributions.map((c) => (
                      <tr key={c._id}>
                        <td className="py-2 px-2.5 font-medium text-slate-700 whitespace-nowrap">
                          {new Date(c.paid_at || c.submitted_at || Date.now()).toLocaleDateString("hi-IN")}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-800">{c.month}</td>
                        <td className="py-2 px-2.5 font-black text-emerald-600">
                          ₹{c.amount}
                        </td>
                        <td className="py-2 px-2.5">
                          {c.payment_screenshot ? (
                            <button
                              onClick={() => setPreviewScreenshot(c.payment_screenshot!)}
                              className="text-[10px] text-blue-600 font-bold hover:underline"
                            >
                              प्रमाण देखें
                            </button>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5">
                          {c.status === "paid" ? (
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold whitespace-nowrap">
                              सफल {c.auto_approved ? "• 24h" : ""}
                            </span>
                          ) : c.status === "pending" ? (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold whitespace-nowrap animate-pulse">
                              ⏳ सत्यापनाधीन
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[9px] font-bold whitespace-nowrap">
                              अस्वीकृत
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LOAN APPLICATION & REPAYMENT (Standard App View)   */}
      {/* ======================================================== */}
      {activeTab === "loan" && (
        <div className="space-y-3 animate-fade-in">
          {/* Active Loan Status Card */}
          {activeLoan ? (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-indigo-400 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider">
                      {activeLoan.status === "disbursed"
                        ? "सक्रिय लोन"
                        : "आवेदन लंबित"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {activeLoan._id?.slice(-6)}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                    ₹{activeLoan.requested_amount} का लोन रिकॉर्ड
                  </h3>
                </div>

                {activeLoan.status === "disbursed" && (
                  <div>
                    {activeLoan.repayment_status === "pending_approval" ? (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        <span>चुकता स्क्रीनशॉट दर्ज है (24h में स्वतः)</span>
                      </div>
                    ) : ((currentDay <= 15) || Boolean(systemSettings?.allow_loan_repay_after_15th)) ? (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => {
                            setRepayScreenshot("");
                            setShowRepayModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active-press"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>लोन चुकता करें (Pay ₹{activeLoan.total_payable})</span>
                        </button>
                        {currentDay > 15 && systemSettings?.allow_loan_repay_after_15th && (
                          <span className="text-[9px] text-emerald-600 font-bold">
                            ★ एडमिन विशेष अनुमति द्वारा 15 के बाद भी सक्रिय
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-0.5 max-w-sm">
                        <div className="flex items-center gap-1 font-bold text-amber-800">
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>लोन चुकता तारीख समाप्त (15 तारीख)</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-snug">
                          आज {currentDay} तारीख है। एडमिन अनुमति पर ही खुलेगा।
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rejection Alert if Admin rejected repayment */}
              {activeLoan.status === "disbursed" && activeLoan.repayment_status === "rejected" && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">⚠️ पिछला लोन अदायगी स्क्रीनशॉट एडमिन द्वारा अस्वीकृत हुआ था</p>
                    {activeLoan.repayment_note && (
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        <b>कारण:</b> {activeLoan.repayment_note}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-600 mt-1">
                      कृपया सही भुगतान कर नया स्क्रीनशॉट पुनः अपलोड करें।
                    </p>
                  </div>
                </div>
              )}

              {/* Loan Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[9px]">आवेदन राशि:</span>
                  <span className="font-black text-slate-800 text-xs">
                    ₹{activeLoan.requested_amount}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[9px]">5% शुल्क:</span>
                  <span className="font-bold text-rose-600 text-xs">
                    -₹{activeLoan.processing_fee_amount}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[9px]">प्राप्त (95%):</span>
                  <span className="font-black text-emerald-700 text-xs">
                    ₹{activeLoan.disbursed_amount}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[9px]">ब्याज:</span>
                  <span className="font-bold text-amber-700 text-xs">
                    +₹{activeLoan.interest_accumulated || 0}
                  </span>
                </div>
              </div>

              {/* Screenshot Proof by Admin */}
              {activeLoan.payment_screenshot && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      <span>एडमिन स्क्रीनशॉट (UTR: {activeLoan.transaction_utr || "—"})</span>
                    </span>
                    <button
                      onClick={() => setPreviewScreenshot(activeLoan.payment_screenshot)}
                      className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-0.5"
                    >
                      <Eye className="w-3 h-3" />
                      <span>बड़ा देखें</span>
                    </button>
                  </div>
                  <img
                    src={activeLoan.payment_screenshot}
                    alt="Payment Proof"
                    className="max-h-40 rounded-lg border border-blue-200 object-contain bg-white cursor-pointer"
                    onClick={() => setPreviewScreenshot(activeLoan.payment_screenshot)}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Loan Application Form */
            <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">लोन के लिए आवेदन करें</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  आपकी कुल जमा राशि ₹{myTotalDeposited} है एवं कुल कम्युनिटी फंड ₹{communityPoolTotal} है। आप अधिकतम <b>कम्युनिटी फंड (₹{maxLoanEligible})</b> तक
                  लोन ले सकते हैं।
                </p>
              </div>

              {loanMsg && (
                <div
                  className={`p-2 rounded-xl text-xs font-bold ${
                    loanMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border border-rose-200 text-rose-800"
                  }`}
                >
                  {loanMsg.text}
                </div>
              )}

              {/* Terms alert */}
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] space-y-0.5 font-medium">
                <p className="font-bold flex items-center gap-1 text-slate-800">
                  <AlertCircle className="w-3 h-3 text-amber-700 shrink-0" />
                  <span>लोन नियम एवं शर्तें:</span>
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[9px]">
                  <li>लोन राशि पर <b>1% प्रति माह</b> का ब्याज लगेगा (हर महीने की 10 तारीख को गणना)।</li>
                  <li>लोन में से <b>5% शुल्क</b> कटेगा, और <b>95% राशि</b> भेजी जाएगी।</li>
                </ul>
              </div>

              <form onSubmit={handleApplyLoan} className="space-y-2.5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                      आवश्यक लोन राशि (₹)
                    </label>
                    {maxLoanEligible > 0 && (
                      <button
                        type="button"
                        onClick={() => setLoanAmountInput(String(maxLoanEligible))}
                        className="text-[9px] font-bold text-blue-600 hover:underline"
                      >
                        अधिकतम (₹{maxLoanEligible}) चुनें
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    max={maxLoanEligible}
                    min={10}
                    value={loanAmountInput}
                    onChange={(e) => setLoanAmountInput(e.target.value)}
                    placeholder={`उदा. ${maxLoanEligible > 0 ? maxLoanEligible : 500}`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                {/* Live Breakdown Preview */}
                {Number(loanAmountInput) > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">कुल आवेदन राशि:</span>
                      <span className="font-bold text-slate-800">₹{Number(loanAmountInput)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">5% प्रोसेसिंग शुल्क (कटौती):</span>
                      <span className="font-bold text-rose-600">
                        -₹{Math.round(Number(loanAmountInput) * 0.05)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="font-bold text-slate-800">
                        आपके UPI/खाते में भेजे जाने वाली शुद्ध राशि (95%):
                      </span>
                      <span className="font-black text-emerald-600 text-sm">
                        ₹{Math.round(Number(loanAmountInput) * 0.95)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    लोन का कारण (Reason)
                  </label>
                  <input
                    type="text"
                    value={loanReasonInput}
                    onChange={(e) => setLoanReasonInput(e.target.value)}
                    placeholder="उदा. चिकित्सा आवश्यकता, आवश्यक घरेलू खर्च"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingLoan || maxLoanEligible <= 0}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                >
                  {submittingLoan ? "आवेदन भेजा जा रहा है..." : "लोन आवेदन सबमिट करें (Apply Loan)"}
                </button>
              </form>
            </div>
          )}

          {/* Past Loans History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">मेरे पूर्व लोन (Past Loans)</h3>
            {myLoans.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                कोई पिछला लोन रिकॉर्ड नहीं है।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[11px]">
                      <th className="py-2.5 px-4">आवेदन तारीख</th>
                      <th className="py-2.5 px-4">आवेदन राशि</th>
                      <th className="py-2.5 px-4">प्राप्त राशि (90%)</th>
                      <th className="py-2.5 px-4">स्थिति</th>
                      <th className="py-2.5 px-4">स्क्रीनशॉट प्रूफ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myLoans.map((l) => (
                      <tr key={l._id}>
                        <td className="py-2.5 px-4 font-semibold text-slate-700">
                          {new Date(l.requested_at).toLocaleDateString("hi-IN")}
                        </td>
                        <td className="py-2.5 px-4 font-black text-slate-800">
                          ₹{l.requested_amount}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-emerald-600">
                          ₹{l.disbursed_amount}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              l.status === "repaid"
                                ? "bg-emerald-100 text-emerald-800"
                                : l.status === "disbursed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {l.status === "repaid"
                              ? "चुकता (Repaid)"
                              : l.status === "disbursed"
                              ? "चालू (Active)"
                              : "लंबित"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          {l.payment_screenshot ? (
                            <button
                              onClick={() => setPreviewScreenshot(l.payment_screenshot!)}
                              className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>देखें</span>
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
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MY PROFILE & KYC (Dedicated Standalone Screen)     */}
      {/* ======================================================== */}
      {activeTab === "my_profile" && (
        <div className="space-y-3 animate-fade-in">
          {/* Main User Card with Large Circular Photo or Letter Avatar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs text-center space-y-3 relative overflow-hidden">
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 opacity-90" />

            {/* Avatar Circle */}
            <div className="relative pt-6 flex justify-center">
              <div className="relative">
                {member?.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center border-4 border-white shadow-md">
                    {member?.name ? member.name.charAt(0).toUpperCase() : "M"}
                  </div>
                )}
                <span
                  className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs"
                  title="सक्रिय सदस्य"
                />
              </div>
            </div>

            {/* Name & Credentials */}
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {member?.name || "सदस्य"}
              </h2>
              <p className="text-xs text-slate-500 font-mono font-medium">
                +91 {member?.mobile}
              </p>
              {member?.email && (
                <p className="text-[11px] text-slate-400 font-mono">
                  {member?.email}
                </p>
              )}
            </div>

            {/* DFI Security Badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>DFI प्रमाणित सदस्य • ID: {member?._id?.slice(-6)}</span>
              </span>
            </div>

            {/* Financial Overview Chips */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">कुल जमा बचत</span>
                <span className="text-sm font-black text-emerald-600">
                  ₹{myTotalDeposited.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">आपातकालीन लोन पात्रता</span>
                <span className="text-sm font-black text-blue-600">
                  ₹{maxLoanEligible.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* KYC Documents Section */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>सत्यापित पहचान दस्तावेज (KYC Documents)</span>
            </h3>

            {/* Aadhaar Details */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-600 block text-[10px]">
                  आधार कार्ड (Aadhaar Card)
                </span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {member?.aadhaar_number ? `XXXX-XXXX-${member.aadhaar_number.slice(-4)}` : "दर्ज नहीं"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                  सत्यापित
                </span>
                {member?.aadhaar_file && (
                  <a
                    href={member.aadhaar_file}
                    download={member.aadhaar_file_name || "Aadhaar.pdf"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>देखें</span>
                  </a>
                )}
              </div>
            </div>

            {/* PAN Details */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-600 block text-[10px]">
                  पैन कार्ड (PAN Card)
                </span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {member?.pan_number || "दर्ज नहीं"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                  सत्यापित
                </span>
                {member?.pan_file && (
                  <a
                    href={member.pan_file}
                    download={member.pan_file_name || "PAN.pdf"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>देखें</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Payment & Bank Details */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>पंजीकृत बैंक व डिजिटल भुगतान विवरण</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 text-[9px] block">UPI ID</span>
                <span className="font-bold text-slate-800 text-xs truncate block">{member?.upi_id || "—"}</span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 text-[9px] block">PhonePe/GPay</span>
                <span className="font-bold text-slate-800 font-mono text-xs truncate block">
                  {member?.wallet_number || "—"}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 text-[9px] block">खाता संख्या</span>
                <span className="font-bold text-slate-800 font-mono text-xs truncate block">
                  {member?.account_number || "—"}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 text-[9px] block">IFSC ({member?.bank_name || "Bank"})</span>
                <span className="font-bold text-slate-800 font-mono uppercase text-xs truncate block">
                  {member?.ifsc || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Help & Support (Reference Image Slide 3 Style) */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              Help & Support (सहायता)
            </span>

            <a
              href="https://wa.me/919140052000?text=नमस्ते%20DFI%20हेल्पलाइन%20सहायता"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition active:scale-98 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 block">24*7 हेल्पलाइन व व्हाट्सएप</span>
                  <span className="text-[10px] text-slate-400 block">+91 91400 52000</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
            </a>

            <a
              href="mailto:help@bbccfund.org"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition active:scale-98 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 block">ईमेल सहायता</span>
                  <span className="text-[10px] text-slate-400 block">help@bbccfund.org</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
            </a>

            <Link
              href="/rules"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition active:scale-98 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 block">DFI नियम एवं शर्तें</span>
                  <span className="text-[10px] text-slate-400 block">100% सुरक्षित एवं पारदर्शी नियम</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
            </Link>

            <button
              onClick={() => {
                if (typeof window !== "undefined" && navigator.share) {
                  navigator.share({
                    title: "DFI - Digital Fund India",
                    text: "DFI सुरक्षित समुदाय फंड एवं आकस्मिक लोन ऐप से जुड़ें।",
                    url: window.location.origin,
                  }).catch(() => {});
                } else if (typeof window !== "undefined") {
                  navigator.clipboard.writeText(window.location.origin);
                  alert("ऐप लिंक कॉपी कर लिया गया है!");
                }
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition active:scale-98 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 block">शेयर ऐप (Share App)</span>
                  <span className="text-[10px] text-slate-400 block">दोस्तों व परिवार के साथ साझा करें</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
            </button>
          </div>

          {/* Red Logout Button */}
          <div className="pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs transition active:scale-95 shadow-2xs"
            >
              <LogOut className="w-4 h-4" />
              <span>लॉगआउट करें (Log out)</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TRANSPARENCY & COMMUNITY (Standard App View)       */}
      {/* ======================================================== */}
      {activeTab === "transparency" && (
        <div className="space-y-3 animate-fade-in">
          {/* Section 1: All Group Members Directory */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                DFI सदस्य डायरेक्टरी ({allMembers.length} सक्रिय सदस्य)
              </h3>
              <p className="text-[10px] text-slate-500">ग्रुप के सभी सक्रिय सदस्यों की सार्वजनिक सूची</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allMembers.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80"
                >
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt={m.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {m.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate">{m.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">📞 {m.mobile}</p>
                    {m.upi_id && (
                      <p className="text-[9px] text-emerald-700 truncate">UPI: {m.upi_id}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: All Contributions Transparency */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                समूह जमा इतिहास (Community Contributions)
              </h3>
              <p className="text-[10px] text-slate-500">
                कुल कम्युनिटी फंड: ₹{communityPoolTotal}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2 px-2.5">सदस्य</th>
                    <th className="py-2 px-2.5">तारीख</th>
                    <th className="py-2 px-2.5">माह</th>
                    <th className="py-2 px-2.5">राशि</th>
                    <th className="py-2 px-2.5">प्रमाण</th>
                    <th className="py-2 px-2.5">स्थिति</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contributions.map((c) => (
                    <tr key={c._id}>
                      <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">{c.member_name}</td>
                      <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap">
                        {new Date(c.paid_at || c.submitted_at || Date.now()).toLocaleDateString("hi-IN")}
                      </td>
                      <td className="py-2 px-2.5 font-semibold text-slate-800">{c.month}</td>
                      <td className="py-2 px-2.5 font-black text-emerald-600">₹{c.amount}</td>
                      <td className="py-2 px-2.5">
                        {c.payment_screenshot ? (
                          <button
                            onClick={() => setPreviewScreenshot(c.payment_screenshot!)}
                            className="text-[10px] text-blue-600 font-bold hover:underline"
                          >
                            देखें
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-2 px-2.5">
                        {c.status === "paid" ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold whitespace-nowrap">
                            स्वीकृत {c.auto_approved ? "(24h)" : ""}
                          </span>
                        ) : c.status === "pending" ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold whitespace-nowrap animate-pulse">
                            सत्यापनाधीन
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[9px] font-bold whitespace-nowrap">
                            अस्वीकृत
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: All Loans Transparency & Screenshots */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                समूह लोन इतिहास एवं पेमेंट प्रमाण
              </h3>
              <p className="text-[10px] text-slate-500">
                किस सदस्य ने कितना लोन लिया और एडमिन भुगतान प्रमाण
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2 px-2.5">सदस्य</th>
                    <th className="py-2 px-2.5">लोन राशि</th>
                    <th className="py-2 px-2.5">प्राप्त (90%)</th>
                    <th className="py-2 px-2.5">तारीख</th>
                    <th className="py-2 px-2.5">स्थिति</th>
                    <th className="py-2 px-2.5">प्रमाण</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allLoans.map((l) => (
                    <tr key={l._id}>
                      <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">{l.member_name}</td>
                      <td className="py-2 px-2.5 font-bold text-slate-800">₹{l.requested_amount}</td>
                      <td className="py-2 px-2.5 font-black text-emerald-600">₹{l.disbursed_amount}</td>
                      <td className="py-2 px-2.5 text-slate-500 whitespace-nowrap">
                        {l.disbursed_at
                          ? new Date(l.disbursed_at).toLocaleDateString("hi-IN")
                          : "लंबित"}
                      </td>
                      <td className="py-2 px-2.5">
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold whitespace-nowrap ${
                            l.status === "repaid"
                              ? "bg-emerald-100 text-emerald-800"
                              : l.status === "disbursed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {l.status === "repaid"
                            ? "चुकता"
                            : l.status === "disbursed"
                            ? "सक्रिय"
                            : "लंबित"}
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        {l.payment_screenshot ? (
                          <button
                            onClick={() => setPreviewScreenshot(l.payment_screenshot!)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition text-[10px]"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>देखें</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">—</span>
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

      {/* Direct UPI Monthly Deposit Modal (Only Screenshot Required) */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-scale-in glass-panel my-8 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">मासिक अंशदान जमा (₹{totalPayableAmount})</h4>
                  <p className="text-[11px] text-slate-500">सीधे UPI / QR द्वारा भुगतान करें</p>
                </div>
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Transparent Breakdown Box */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-700">
                <span>मूल मासिक बचत अंशदान:</span>
                <span className="font-bold text-emerald-700">₹{monthlyDepositAmount}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>प्लेटफ़ॉर्म मेंटेनेंस शुल्क:</span>
                <span className="font-bold text-blue-700">
                  {platformFee === 0 ? "₹0 (मुफ़्त / Free)" : `+₹${platformFee}`}
                </span>
              </div>
              <div className="border-t border-blue-200 pt-1 flex justify-between font-black text-slate-900 text-sm">
                <span>कुल भुगतान राशि:</span>
                <span className="text-blue-700">₹{totalPayableAmount}</span>
              </div>
              <p className="text-[10px] text-slate-500 italic pt-0.5">
                {platformFee > 0
                  ? `* आपके फंड बचत खाते में मूल राशि (₹${monthlyDepositAmount}) ही जुड़ेगी। ₹${platformFee} प्लेटफ़ॉर्म शुल्क है।`
                  : `* आपके फंड बचत खाते में पूरी मूल राशि (₹${monthlyDepositAmount}) जुड़ेगी। कोई अतिरिक्त शुल्क नहीं है।`}
              </p>
            </div>

            {/* QR Code Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="inline-block p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <img
                  src={
                    systemSettings?.admin_qr_code ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                      `upi://pay?pa=${adminUpi}&pn=${adminName}&am=${totalPayableAmount}&cu=INR`
                    )}`
                  }
                  alt="Admin Payment QR Code"
                  className="w-48 h-48 mx-auto object-contain rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  एडमिन UPI ID
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono font-bold text-slate-800 text-sm">{adminUpi}</span>
                  <button
                    onClick={handleCopyUpi}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition text-xs font-semibold flex items-center gap-1"
                    title="UPI ID कॉपी करें"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedUpi ? "कॉपी हो गया ✓" : "कॉपी"}</span>
                  </button>
                </div>
              </div>

              {/* Mobile 1-Click Pay App Deep Link */}
              <a
                href={`upi://pay?pa=${adminUpi}&pn=${encodeURIComponent(adminName)}&am=${totalPayableAmount}&cu=INR`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active-press"
              >
                <span>📱 PhonePe / GPay से सीधे ₹{totalPayableAmount} भेजें</span>
              </a>
            </div>

            {/* Upload Screenshot (Only Screenshot Required!) */}
            <form onSubmit={handleSubmitDepositScreenshot} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  भुगतान का स्क्रीनशॉट चुनें (फ़ोटो/स्क्रीनशॉट) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleDepositFile}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition cursor-pointer"
                />

                {depositScreenshot && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <img
                      src={depositScreenshot}
                      alt="Deposit Proof Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-emerald-300 shrink-0"
                    />
                    <div className="text-xs text-emerald-800 font-bold">
                      ✓ स्क्रीनशॉट तैयार है
                    </div>
                  </div>
                )}
              </div>

              {/* 24-Hour Auto-Approval Reassurance */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  स्क्रीनशॉट दर्ज होते ही आपका अनुरोध सुरक्षित हो जाएगा। एडमिन द्वारा तुरंत, या <b>24 घंटे में स्वतः (Auto-Approve)</b> आपके खाते में मूल अंशदान ₹{monthlyDepositAmount} जमा दर्ज हो जाएगा।
                </span>
              </div>

              <button
                type="submit"
                disabled={!depositScreenshot || submittingDeposit}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 active-press"
              >
                {submittingDeposit ? (
                  <span>सबमिट हो रहा है...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>₹{totalPayableAmount} जमा स्क्रीनशॉट सबमिट करें</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Direct UPI Loan Repayment Modal */}
      {showRepayModal && activeLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in glass-panel my-8 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">लोन चुकता भुगतान</h4>
                  <p className="text-[11px] text-slate-500">कुल देय राशि: ₹{activeLoan.total_payable}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRepayModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="inline-block p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <img
                  src={
                    systemSettings?.admin_qr_code ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                      `upi://pay?pa=${adminUpi}&pn=${adminName}&am=${activeLoan.total_payable}&cu=INR`
                    )}`
                  }
                  alt="Admin Payment QR Code"
                  className="w-48 h-48 mx-auto object-contain rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  एडमिन UPI ID
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono font-bold text-slate-800 text-sm">{adminUpi}</span>
                  <button
                    onClick={handleCopyUpi}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition text-xs font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedUpi ? "कॉपी हो गया ✓" : "कॉपी"}</span>
                  </button>
                </div>
              </div>

              <a
                href={`upi://pay?pa=${adminUpi}&pn=${encodeURIComponent(adminName)}&am=${activeLoan.total_payable}&cu=INR`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition active-press"
              >
                <span>📱 PhonePe / GPay से सीधे ₹{activeLoan.total_payable} भेजें</span>
              </a>
            </div>

            {/* Upload Screenshot */}
            <form onSubmit={handleSubmitRepayScreenshot} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  भुगतान का स्क्रीनशॉट अपलोड करें <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleRepayFile}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition cursor-pointer"
                />

                {repayScreenshot && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <img
                      src={repayScreenshot}
                      alt="Repay Proof Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-emerald-300 shrink-0"
                    />
                    <div className="text-xs text-emerald-800 font-bold">
                      ✓ स्क्रीनशॉट तैयार है
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  स्क्रीनशॉट सबमिट करने के बाद <b>24 घंटे में यह अपने आप (Auto-Approve)</b> लोन चुकता के रूप में दर्ज हो जाएगा।
                </span>
              </div>

              <button
                type="submit"
                disabled={!repayScreenshot || submittingRepay}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 active-press"
              >
                {submittingRepay ? (
                  <span>सबमिट हो रहा है...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>लोन चुकता स्क्रीनशॉट सबमिट करें</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Screenshot Zoom Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scale-in glass-panel">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                एडमिन द्वारा लोन भुगतान स्क्रीनशॉट प्रमाण
              </h4>
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="text-xs text-slate-500 font-bold hover:underline"
              >
                बंद करें ✕
              </button>
            </div>
            <img
              src={previewScreenshot}
              alt="Payment Screenshot"
              className="max-h-[70vh] w-full object-contain rounded-2xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemberDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-600">डैशबोर्ड लोड हो रहा है...</p>
          </div>
        </div>
      }
    >
      <MemberDashboardContent />
    </Suspense>
  );
}
