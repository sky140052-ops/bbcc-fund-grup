"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  QrCode,
  Copy,
  Upload,
  ArrowRight,
  Sparkles,
  Calendar,
  CreditCard,
  UserCheck,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { compressImage } from "../../lib/compress";

interface PublicMember {
  _id: string;
  name: string;
  mobile: string;
  aadhaar_last4: string;
}

interface LoanForRepay {
  loan_id: string;
  member_id: string;
  member_name: string;
  requested_amount: number;
  disbursed_amount: number;
  interest: number;
  total_payable: number;
  months: number;
  repayment_status: string;
  repayment_screenshot?: string;
}

interface PayPageData {
  current_month: string;
  current_day: number;
  is_deposit_allowed: boolean;
  is_repay_allowed: boolean;
  settings: {
    admin_upi_id: string;
    admin_upi_name: string;
    admin_qr_code: string;
    admin_bank_name: string;
    admin_account_number: string;
    admin_ifsc: string;
    allow_deposit_after_10th: boolean;
    allow_loan_repay_after_15th: boolean;
    monthly_contribution_amount?: number;
    platform_fee?: number;
    total_monthly_payable?: number;
  };
  members: PublicMember[];
  loans_for_repay: LoanForRepay[];
  member_deposit_status?: {
    status: "paid" | "pending" | "rejected";
    amount: number;
    month: string;
    submitted_at: string;
    rejection_reason?: string;
    auto_approved?: boolean;
  } | null;
  member_active_loan?: {
    loan_id: string;
    member_id: string;
    requested_amount: number;
    interest: number;
    total_payable: number;
    months: number;
    repayment_status: string;
  } | null;
}

export default function PublicPayPage() {
  const [activeTab, setActiveTab] = useState<"deposit" | "loan_repay">("deposit");
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<PayPageData | null>(null);

  // Tab 1: Deposit state
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [depositScreenshot, setDepositScreenshot] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Tab 2: Loan Repay state
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [repayScreenshot, setRepayScreenshot] = useState("");
  const [submittingRepay, setSubmittingRepay] = useState(false);
  const [repayMsg, setRepayMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [copiedUpi, setCopiedUpi] = useState(false);

  // Fetch initial data
  const fetchData = async (memberId = "") => {
    try {
      const url = memberId ? `/api/pay?member_id=${encodeURIComponent(memberId)}` : "/api/pay";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setPageData(data);
      }
    } catch (err) {
      console.error("Failed to load pay data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMemberSelect = (mId: string) => {
    setSelectedMemberId(mId);
    setDepositMsg(null);
    setDepositScreenshot("");
    if (mId) {
      fetchData(mId);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleDepositFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 900, maxHeight: 1200, quality: 0.75 });
      setDepositScreenshot(compressed);
    } catch {
      alert("स्क्रीनशॉट प्रोसेस करने में त्रुटि। कृपया पुनः प्रयास करें।");
    }
  };

  const handleRepayFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 900, maxHeight: 1200, quality: 0.75 });
      setRepayScreenshot(compressed);
    } catch {
      alert("स्क्रीनशॉट प्रोसेस करने में त्रुटि। कृपया पुनः प्रयास करें।");
    }
  };

  // Submit Monthly Deposit
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setDepositMsg({ type: "error", text: "कृपया पहले अपना नाम सूची से चुनें।" });
      return;
    }
    if (!depositScreenshot) {
      setDepositMsg({ type: "error", text: "कृपया भुगतान स्क्रीनशॉट अवश्य चुनें।" });
      return;
    }

    setSubmittingDeposit(true);
    setDepositMsg(null);

    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_deposit",
          member_id: selectedMemberId,
          payment_screenshot: depositScreenshot,
          note: depositNote,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "स्क्रीनशॉट जमा करने में विफल।");
      }

      setDepositMsg({ type: "success", text: result.message });
      setDepositScreenshot("");
      fetchData(selectedMemberId);
    } catch (err: any) {
      setDepositMsg({ type: "error", text: err.message || "त्रुटि हुई।" });
    } finally {
      setSubmittingDeposit(false);
    }
  };

  // Submit Loan Repayment
  const handleSubmitRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) {
      setRepayMsg({ type: "error", text: "कृपया सूची से अपना लोन चुनें।" });
      return;
    }
    if (!repayScreenshot) {
      setRepayMsg({ type: "error", text: "कृपया लोन अदायगी का स्क्रीनशॉट अवश्य चुनें।" });
      return;
    }

    const loanObj = pageData?.loans_for_repay.find((l) => l.loan_id === selectedLoanId);

    setSubmittingRepay(true);
    setRepayMsg(null);

    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_repayment",
          loan_id: selectedLoanId,
          member_id: loanObj?.member_id,
          amount: loanObj?.total_payable,
          repayment_screenshot: repayScreenshot,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "लोन अदायगी स्क्रीनशॉट जमा करने में विफल।");
      }

      setRepayMsg({ type: "success", text: result.message });
      setRepayScreenshot("");
      fetchData();
    } catch (err: any) {
      setRepayMsg({ type: "error", text: err.message || "त्रुटि हुई।" });
    } finally {
      setSubmittingRepay(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-slate-300">भुगतान पोर्टल लोड हो रहा है...</p>
      </div>
    );
  }

  const selectedMemberObj = pageData?.members.find((m) => m._id === selectedMemberId);
  const selectedLoanObj = pageData?.loans_for_repay.find((l) => l.loan_id === selectedLoanId);
  const upiId = pageData?.settings.admin_upi_id || "sky140052@okaxis";
  const upiName = pageData?.settings.admin_upi_name || "DFI इमरजेंसी सेवा";

  const monthlyAmount = pageData?.settings.monthly_contribution_amount || 100;
  const platformFee = pageData?.settings.platform_fee !== undefined ? pageData.settings.platform_fee : 3;
  const totalPayable = monthlyAmount + platformFee;

  // Intent links for 1-click payment
  const depositUpiIntent = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${totalPayable}&cu=INR&tn=${encodeURIComponent(`DFI Deposit - ${selectedMemberObj?.name || "Member"}`)}`;
  const repayUpiIntent = selectedLoanObj
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${selectedLoanObj.total_payable}&cu=INR&tn=${encodeURIComponent(`DFI Loan Repay - ${selectedLoanObj.member_name}`)}`
    : "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 sm:pb-8">
      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 flex-1">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-800/80 border border-slate-700/60 rounded-2xl mb-5 shadow-xl">
          <button
            type="button"
            onClick={() => setActiveTab("deposit")}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              activeTab === "deposit"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. मासिक अंशदान (₹{totalPayable})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("loan_repay")}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              activeTab === "loan_repay"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>2. लोन वापसी / किश्त</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: MONTHLY DEPOSIT (₹100)                            */}
        {/* ======================================================== */}
        {activeTab === "deposit" && (
          <div className="space-y-6">
            {/* Date Window Banner */}
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 ${
                pageData?.is_deposit_allowed
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                  : "bg-amber-950/40 border-amber-800/60 text-amber-300"
              }`}
            >
              <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  माह: {pageData?.current_month} • अंशदान अवधि: 1 से 10 तारीख
                </p>
                <p className="text-[12px] opacity-90 mt-0.5">
                  {pageData?.is_deposit_allowed
                    ? "अंशदान विंडो खुली है। कृपया अपना नाम चुनकर ₹100 का स्क्रीनशॉट जमा करें।"
                    : "अंशदान की निर्धारित तिथि (1 से 10 तारीख) समाप्त हो चुकी है। एडमिन द्वारा सक्रिय किए जाने पर ही जमा होगा।"}
                </p>
              </div>
            </div>

            {/* Step 1: Member Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">
                1. सूची से अपना नाम चुनें (कुल {pageData?.members.length || 0} सदस्य) *
              </label>
              <div className="relative">
                <select
                  value={selectedMemberId}
                  onChange={(e) => handleMemberSelect(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- अपना नाम चुनें --</option>
                  {pageData?.members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} {m.aadhaar_last4 ? `(आधार: ..${m.aadhaar_last4})` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>

              {selectedMemberObj && (
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold">{selectedMemberObj.name}</span>
                  </div>
                  <span className="text-slate-400 font-mono">
                    मोबाइल: {selectedMemberObj.mobile || "—"}
                  </span>
                </div>
              )}
            </div>

            {/* Check Member Status if selected */}
            {selectedMemberId && pageData?.member_deposit_status && (
              <div>
                {pageData.member_deposit_status.status === "paid" && (
                  <div className="bg-emerald-950/60 border border-emerald-700/70 rounded-2xl p-5 text-emerald-200 shadow-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white">अंशदान पहले से स्वीकृत (Paid)</h3>
                        <p className="text-xs text-emerald-300">
                          माह {pageData.member_deposit_status.month} का ₹{pageData.member_deposit_status.amount} अंशदान स्वीकृत हो चुका है।
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-900/30 rounded-xl text-xs text-emerald-300 border border-emerald-800/40">
                      ✓ आपके खाते में यह राशि संचित है। आपको इस माह दोबारा स्क्रीनशॉट अपलोड करने की आवश्यकता नहीं है।
                    </div>
                  </div>
                )}

                {pageData.member_deposit_status.status === "pending" && (
                  <div className="bg-amber-950/60 border border-amber-700/70 rounded-2xl p-5 text-amber-200 shadow-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-600/30 flex items-center justify-center text-amber-400">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white">स्क्रीनशॉट समीक्षाधीन है (Pending)</h3>
                        <p className="text-xs text-amber-300">
                          आपका ₹{pageData.member_deposit_status.amount} का स्क्रीनशॉट दर्ज है।
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-900/30 rounded-xl text-xs text-amber-300 border border-amber-800/40 space-y-1">
                      <p className="font-bold">⏳ 24 घंटे में स्वतः स्वीकृति (Auto-Approval)</p>
                      <p className="opacity-90">
                        यदि एडमिन द्वारा 24 घंटे के भीतर इसे स्वीकृत नहीं किया जाता, तो सिस्टम द्वारा यह स्वतः स्वीकृत हो जाएगा।
                      </p>
                      <p className="text-[11px] text-amber-400/90 font-semibold pt-1">
                        🔒 डुप्लीकेट सुरक्षा: जब तक यह स्वीकृत या अस्वीकृत नहीं होता, दोबारा स्क्रीनशॉट अपलोड नहीं किया जा सकता।
                      </p>
                    </div>
                  </div>
                )}

                {pageData.member_deposit_status.status === "rejected" && (
                  <div className="bg-rose-950/60 border border-rose-700/70 rounded-2xl p-4 text-rose-200 shadow-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                      <span>पिछला स्क्रीनशॉट अस्वीकृत हो गया था</span>
                    </div>
                    <p className="text-xs text-rose-300">
                      कारण: {pageData.member_deposit_status.rejection_reason || "अस्पष्ट प्रमाण"}
                    </p>
                    <p className="text-xs text-rose-400 font-semibold">
                      कृपया नीचे दिए गए UPI / QR कोड पर भुगतान करके सही स्क्रीनशॉट पुनः अपलोड करें।
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Payment & Upload Section: Visible only if not paid and not pending */}
            {selectedMemberId &&
              (!pageData?.member_deposit_status ||
                pageData.member_deposit_status.status === "rejected") && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-blue-400" />
                        <span>2. ₹{totalPayable} का भुगतान करें</span>
                      </h2>
                      <p className="text-[11px] text-slate-400">QR कोड स्कैन करें या 1-क्लिक बटन से पे करें</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 block">
                        ₹{totalPayable}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {platformFee === 0
                          ? `(अंशदान ₹${monthlyAmount} • शुल्क मुफ़्त)`
                          : `(अंशदान ₹${monthlyAmount} + शुल्क ₹${platformFee})`}
                      </span>
                    </div>
                  </div>

                  {/* Fee Breakdown Info Box */}
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-300">
                      <span>मूल मासिक अंशदान (आपके संचित फंड में जमा):</span>
                      <span className="font-bold text-white font-mono">₹{monthlyAmount}</span>
                    </div>
                    <div className="flex justify-between text-amber-400">
                      <span>प्लेटफॉर्म मेंटेनेंस शुल्क:</span>
                      <span className={`font-bold font-mono ${platformFee === 0 ? "text-emerald-400" : ""}`}>
                        {platformFee === 0 ? "₹0 (मुफ़्त / Free)" : `+₹${platformFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-400 border-t border-slate-800 pt-1.5 font-bold">
                      <span>कुल देय राशि (UPI द्वारा):</span>
                      <span className="font-mono text-sm">₹{totalPayable}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 pt-0.5 leading-snug">
                      * नोट: आपके खाते में केवल मूल अंशदान (₹{monthlyAmount}) जमा माना जाएगा{platformFee > 0 ? `, ₹${platformFee} प्लेटफॉर्म मेंटेनेंस शुल्क है।` : "। (मेंटेनेंस शुल्क मुफ़्त है)।"}
                    </p>
                  </div>

                  {/* QR Code & Direct Apps */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950 rounded-xl border border-slate-800">
                    {pageData?.settings.admin_qr_code ? (
                      <div className="p-2 bg-white rounded-xl shadow-lg flex-shrink-0">
                        <img
                          src={pageData.settings.admin_qr_code}
                          alt="Admin UPI QR"
                          className="w-36 h-36 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-36 h-36 bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 text-xs p-2 text-center">
                        <QrCode className="w-10 h-10 mb-1 text-slate-600" />
                        <span>QR कोड उपलब्ध नहीं</span>
                      </div>
                    )}

                    <div className="space-y-3 flex-1 w-full text-center sm:text-left">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          एडमिन आधिकारिक UPI आईडी
                        </span>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                          <code className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-800/50">
                            {upiId}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(upiId)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                            title="UPI ID कॉपी करें"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        {copiedUpi && (
                          <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                            ✓ UPI ID कॉपी हो गई!
                          </span>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1">
                          प्राप्तकर्ता: <span className="text-slate-200 font-semibold">{upiName}</span>
                        </p>
                      </div>

                      {/* 1-Click Pay Link for mobile */}
                      <div>
                        <a
                          href={depositUpiIntent}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>PhonePe / GPay / Paytm से ₹{totalPayable} पे करें</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Upload Form */}
                  <form onSubmit={handleSubmitDeposit} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
                        3. भुगतान का स्क्रीनशॉट अपलोड करें *
                      </label>
                      <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950/40">
                        {depositScreenshot ? (
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={depositScreenshot}
                              alt="Deposit Screenshot"
                              className="max-h-48 rounded-lg object-contain border border-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => setDepositScreenshot("")}
                              className="text-xs font-bold text-rose-400 hover:underline"
                            >
                              स्क्रीनशॉट हटाएं व दूसरा चुनें
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-blue-400" />
                            <span className="text-xs font-bold text-slate-200 block">
                              गैलरी या फोटो से ₹100 का स्क्रीनशॉट चुनें
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              (स्क्रीनशॉट स्वतः कंप्रेस होकर अपलोड होगा)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleDepositFileChange}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        कोई टिप्पणी / नोट (वैकल्पिक)
                      </label>
                      <input
                        type="text"
                        value={depositNote}
                        onChange={(e) => setDepositNote(e.target.value)}
                        placeholder="उदा. PhonePe से भुगतान किया"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {depositMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                          depositMsg.type === "success"
                            ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                            : "bg-rose-950/80 border border-rose-800 text-rose-300"
                        }`}
                      >
                        {depositMsg.type === "success" ? (
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        )}
                        <span>{depositMsg.text}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingDeposit || !depositScreenshot}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
                    >
                      {submittingDeposit ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>स्क्रीनशॉट जमा हो रहा है...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>₹{totalPayable} अंशदान स्क्रीनशॉट जमा करें</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LOAN REPAYMENT (लोन वापसी)                        */}
        {/* ======================================================== */}
        {activeTab === "loan_repay" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">लोन अदायगी व किश्त पोर्टल (1% मासिक ब्याज)</p>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  यहाँ केवल वही सदस्य प्रदर्शित होंगे जिनका लोन वर्तमान में सक्रिय या चालू (Disbursed) है।
                </p>
              </div>
            </div>

            {/* Loan Selection Dropdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold">
                1. लोन धारक सदस्य चुनें (कुल {pageData?.loans_for_repay.length || 0} सक्रिय लोन) *
              </label>

              {pageData?.loans_for_repay && pageData.loans_for_repay.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedLoanId}
                    onChange={(e) => {
                      setSelectedLoanId(e.target.value);
                      setRepayMsg(null);
                      setRepayScreenshot("");
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- सक्रिय लोन सूची में से चुनें --</option>
                    {pageData.loans_for_repay.map((l) => (
                      <option key={l.loan_id} value={l.loan_id}>
                        {l.member_name} — कुल देय: ₹{l.total_payable} (मूलधन ₹{l.requested_amount} + ब्याज ₹{l.interest})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center text-xs text-slate-400">
                  वर्तमान में किसी भी सदस्य का लोन बकाया नहीं है।
                </div>
              )}
            </div>

            {/* Selected Loan Details */}
            {selectedLoanObj && (
              <div className="space-y-5">
                {/* Check if repayment is pending */}
                {selectedLoanObj.repayment_status === "pending_approval" ? (
                  <div className="bg-amber-950/60 border border-amber-700/70 rounded-2xl p-5 text-amber-200 shadow-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-amber-400 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-base text-white">लोन अदायगी स्क्रीनशॉट समीक्षाधीन है</h3>
                        <p className="text-xs text-amber-300">
                          सदस्य <b>{selectedLoanObj.member_name}</b> का लोन अदायगी प्रमाण दर्ज है।
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-900/30 rounded-xl text-xs text-amber-300 border border-amber-800/40">
                      ⏳ 24 घंटे में स्वतः स्वीकृति (Auto-Approved) द्वारा लोन बंद कर दिया जाएगा। दोबारा अपलोड करने की आवश्यकता नहीं है।
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                    {/* Loan Breakdown Card */}
                    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-bold text-slate-300">सदस्य का नाम</span>
                        <span className="text-sm font-bold text-white">{selectedLoanObj.member_name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-slate-900 rounded-lg">
                          <span className="text-slate-400 block text-[10px]">मूलधन (Principal)</span>
                          <span className="font-bold text-white text-sm">₹{selectedLoanObj.requested_amount}</span>
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded-lg">
                          <span className="text-slate-400 block text-[10px]">संचित ब्याज (1% p.m.)</span>
                          <span className="font-bold text-amber-400 text-sm">₹{selectedLoanObj.interest}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-xs font-bold text-slate-300">कुल देय राशि (Total Payable)</span>
                        <span className="text-lg font-black text-emerald-400">
                          ₹{selectedLoanObj.total_payable}
                        </span>
                      </div>
                    </div>

                    {/* QR Code & UPI Details */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950 rounded-xl border border-slate-800">
                      {pageData?.settings.admin_qr_code ? (
                        <div className="p-2 bg-white rounded-xl shadow-lg flex-shrink-0">
                          <img
                            src={pageData.settings.admin_qr_code}
                            alt="Admin UPI QR"
                            className="w-36 h-36 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-36 h-36 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                          QR कोड
                        </div>
                      )}

                      <div className="space-y-3 flex-1 w-full text-center sm:text-left">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            भुगतान UPI आईडी
                          </span>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                            <code className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-800/50">
                              {upiId}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(upiId)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {repayUpiIntent && (
                          <a
                            href={repayUpiIntent}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>₹{selectedLoanObj.total_payable} सीधे UPI से पे करें</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Repay Form */}
                    <form onSubmit={handleSubmitRepay} className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
                          लोन अदायगी स्क्रीनशॉट अपलोड करें *
                        </label>
                        <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950/40">
                          {repayScreenshot ? (
                            <div className="flex flex-col items-center gap-2">
                              <img
                                src={repayScreenshot}
                                alt="Repay Screenshot"
                                className="max-h-48 rounded-lg object-contain border border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => setRepayScreenshot("")}
                                className="text-xs font-bold text-rose-400 hover:underline"
                              >
                                स्क्रीनशॉट हटाएं व दूसरा चुनें
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer block space-y-2">
                              <Upload className="w-8 h-8 mx-auto text-emerald-400" />
                              <span className="text-xs font-bold text-slate-200 block">
                                ₹{selectedLoanObj.total_payable} का अदायगी स्क्रीनशॉट चुनें
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleRepayFileChange}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {repayMsg && (
                        <div
                          className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                            repayMsg.type === "success"
                              ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                              : "bg-rose-950/80 border border-rose-800 text-rose-300"
                          }`}
                        >
                          {repayMsg.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          )}
                          <span>{repayMsg.text}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submittingRepay || !repayScreenshot}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                      >
                        {submittingRepay ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>लोन अदायगी जमा हो रही है...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>₹{selectedLoanObj.total_payable} लोन अदायगी स्क्रीनशॉट जमा करें</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>© 2026 DFI इमरजेंसी सेवा ग्रुप • पारदर्शी बचत एवं वित्तीय सहयोग पोर्टल</p>
      </footer>
    </div>
  );
}
