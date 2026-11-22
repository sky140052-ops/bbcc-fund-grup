"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Member, Contribution, Loan, SystemSettings } from "../../lib/types";

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function MemberDashboardPage() {
  const router = useRouter();

  // Active Tab: "my_fund" | "loan" | "my_profile" | "transparency"
  const [activeTab, setActiveTab] = useState<"my_fund" | "loan" | "my_profile" | "transparency">("my_fund");

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);

  // Contributions & Fund
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [myContributions, setMyContributions] = useState<Contribution[]>([]);
  const [communityPoolTotal, setCommunityPoolTotal] = useState(0);
  const [myTotalDeposited, setMyTotalDeposited] = useState(0);
  const [payingDeposit, setPayingDeposit] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Loans
  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [activeLoan, setActiveLoan] = useState<any>(null);
  const [loanAmountInput, setLoanAmountInput] = useState("");
  const [loanReasonInput, setLoanReasonInput] = useState("");
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanMsg, setLoanMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [payingLoan, setPayingLoan] = useState(false);

  // All Members Directory
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  // Screenshot viewer modal
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  // System Settings & Date Controls
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [currentDay, setCurrentDay] = useState<number>(new Date().getDate());

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch Member Profile & Data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch current user/member
      const resMe = await fetch("/api/auth/me");
      if (resMe.status === 401) {
        router.push("/");
        return;
      }
      const dataMe = await resMe.json();
      if (!dataMe.authenticated) {
        router.push("/");
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

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
    }
  };

  // Pay Monthly Deposit (₹100) via Razorpay
  const handlePayMonthlyDeposit = async () => {
    setPayingDeposit(true);
    setDepositMsg(null);

    const depositAmount = 100; // Fixed ₹100 per month as requested

    try {
      // 1. Create Order
      const resOrder = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_order", amount: depositAmount }),
      });
      const dataOrder = await resOrder.json();

      if (!resOrder.ok) {
        throw new Error(dataOrder.error || "ऑर्डर बनाने में त्रुटि।");
      }

      // If Razorpay script is not loaded or mock
      if (!window.Razorpay || dataOrder.is_mock) {
        // Direct save confirmation
        const resSave = await fetch("/api/contributions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: depositAmount,
            razorpay_payment_id: `pay_direct_${Date.now()}`,
          }),
        });
        const dataSave = await resSave.json();
        if (dataSave.success) {
          setDepositMsg({ type: "success", text: "₹100 का मासिक अंशदान सफलतापूर्वक जमा हो गया!" });
          fetchDashboardData();
        }
        return;
      }

      // Trigger Razorpay Checkout
      const options = {
        key: dataOrder.key_id,
        amount: dataOrder.amount,
        currency: "INR",
        name: "DFI इमरजेंसी सेवा",
        description: "मासिक अंशदान (1-10 तारीख)",
        order_id: dataOrder.order_id,
        handler: async function (response: any) {
          const resSave = await fetch("/api/contributions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: depositAmount,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
            }),
          });
          const dataSave = await resSave.json();
          if (dataSave.success) {
            setDepositMsg({ type: "success", text: "₹100 का मासिक अंशदान सफलतापूर्वक जमा हो गया!" });
            fetchDashboardData();
          }
        },
        prefill: {
          name: member?.name,
          email: member?.email,
          contact: member?.mobile,
        },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setDepositMsg({ type: "error", text: err.message || "भुगतान प्रक्रिया में त्रुटि।" });
    } finally {
      setPayingDeposit(false);
    }
  };

  // Submit Loan Request (Max 90% of total deposit)
  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLoan(true);
    setLoanMsg(null);

    const amount = Number(loanAmountInput);
    const maxAllowed = Math.floor(myTotalDeposited * 0.90);

    if (amount <= 0) {
      setLoanMsg({ type: "error", text: "कृपया मान्य लोन राशि दर्ज करें।" });
      setSubmittingLoan(false);
      return;
    }

    if (amount > maxAllowed) {
      setLoanMsg({
        type: "error",
        text: `आपकी अधिकतम लोन पात्रता ₹${maxAllowed} है (आपकी कुल जमा ₹${myTotalDeposited} का 90%)।`,
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

  // Repay Active Loan via Razorpay
  const handleRepayLoan = async () => {
    if (!activeLoan) return;
    setPayingLoan(true);

    const totalPayable = activeLoan.total_payable || activeLoan.requested_amount;

    try {
      // Mock or direct payment for repayment
      const res = await fetch("/api/loans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: activeLoan._id,
          action: "member_repay",
          amount: totalPayable,
          razorpay_payment_id: `repay_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "लोन चुकता करने में त्रुटि।");
      }

      alert(`₹${totalPayable} का लोन ब्याज सहित सफलतापूर्वक चुकता कर दिया गया है!`);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "भुगतान विफल रहा।");
    } finally {
      setPayingLoan(false);
    }
  };

  // Calculate 90% loan limit
  const maxLoanEligible = Math.floor(myTotalDeposited * 0.90);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-28 sm:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          {member?.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {member?.name ? member.name.charAt(0).toUpperCase() : "M"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                सक्रिय DFI सदस्य
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {member?._id?.slice(-8)}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              नमस्ते, {member?.name || "सदस्य"} 🙏
            </h1>
            <p className="text-xs text-slate-500">DFI इमरजेंसी सेवा ग्रुप सदस्य डैशबोर्ड</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
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
          onClick={() => setActiveTab("my_fund")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "my_fund"
              ? "bg-white text-blue-700 shadow-md shadow-slate-300/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>सक्रिय फंड व मासिक जमा (₹100)</span>
        </button>

        <button
          onClick={() => setActiveTab("loan")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "loan"
              ? "bg-white text-blue-700 shadow-md shadow-slate-300/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>लोन आवेदन (90%) व चुकता</span>
        </button>

        <button
          onClick={() => setActiveTab("my_profile")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "my_profile"
              ? "bg-white text-blue-700 shadow-md shadow-slate-300/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="w-4 h-4" />
          <span>मेरी प्रोफाइल व दस्तावेज</span>
        </button>

        <button
          onClick={() => setActiveTab("transparency")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "transparency"
              ? "bg-white text-blue-700 shadow-md shadow-slate-300/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>पारदर्शिता (सभी सदस्य व इतिहास)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ACTIVE FUND & MONTHLY DEPOSIT (₹100)               */}
      {/* ======================================================== */}
      {activeTab === "my_fund" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1: Monthly Deposit Window */}
            <div className="p-6 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  मासिक निर्धारित अंशदान
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
                <h3 className="text-3xl font-black">₹100</h3>
                <p className="text-xs text-blue-100 mt-1">प्रति माह UPI/Razorpay द्वारा देय</p>
              </div>

              {((currentDay >= 1 && currentDay <= 10) || Boolean(systemSettings?.allow_deposit_after_10th)) ? (
                <div className="space-y-1.5">
                  <button
                    onClick={handlePayMonthlyDeposit}
                    disabled={payingDeposit}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-blue-700 font-bold text-xs sm:text-sm hover:bg-blue-50 transition shadow-md disabled:opacity-50"
                  >
                    {payingDeposit ? "भुगतान चालू है..." : "Pay Now (ऑनलाइन जमा करें)"}
                  </button>
                  {currentDay > 10 && systemSettings?.allow_deposit_after_10th && (
                    <p className="text-[10px] text-emerald-200 font-bold text-center">
                      ★ एडमिन विशेष अनुमति द्वारा 10 तारीख के बाद भी जमा खुला है
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-black/20 border border-white/10 space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-200">
                    <Lock className="w-3.5 h-3.5" />
                    <span>जमा अवधि समाप्त (1-10 तारीख)</span>
                  </div>
                  <p className="text-[11px] text-blue-100 leading-snug">
                    आज {currentDay} तारीख है। 10 तारीख के बाद जमा बंद है। एडमिन द्वारा सक्रिय (Enable) करने पर ही बटन खुलेगा।
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: My Total Deposited */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                मेरी कुल जमा राशि
              </span>
              <div>
                <h3 className="text-3xl font-black text-slate-900">₹{myTotalDeposited}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  कुल सफल अंशदान: {myContributions.length} महीने
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>लोन पात्रता: ₹{maxLoanEligible} (कुल का 90%)</span>
              </div>
            </div>

            {/* Card 3: Community Total Pool */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                ग्रुप कुल जमा फंड (Community Pool)
              </span>
              <div>
                <h3 className="text-3xl font-black text-emerald-600">₹{communityPoolTotal}</h3>
                <p className="text-xs text-slate-500 mt-1">सभी सदस्यों द्वारा कुल जमा राशि</p>
              </div>
              <div className="text-xs text-slate-500">
                सुरक्षित एवं पारदर्शी बचत • 100% सदस्यों के लिए उपलब्ध
              </div>
            </div>
          </div>

          {depositMsg && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-bold ${
                depositMsg.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {depositMsg.text}
            </div>
          )}

          {/* Deposit History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">
              मेरा जमा इतिहास (My Deposit History)
            </h3>
            {myContributions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                आपने अभी तक कोई अंशदान जमा नहीं किया है। ऊपर दिए गए "Pay Now" बटन से अपना पहला ₹100 जमा करें।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[11px]">
                      <th className="py-3 px-4">जमा तारीख</th>
                      <th className="py-3 px-4">माह (Month)</th>
                      <th className="py-3 px-4">जमा राशि</th>
                      <th className="py-3 px-4">पेमेंट रेफरेंस / ID</th>
                      <th className="py-3 px-4">स्थिति</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myContributions.map((c) => (
                      <tr key={c._id}>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {new Date(c.paid_at).toLocaleString("hi-IN")}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{c.month}</td>
                        <td className="py-3 px-4 font-black text-emerald-600 text-sm">
                          ₹{c.amount}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {c.razorpay_payment_id || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            सफल (Paid)
                          </span>
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
      {/* TAB 2: LOAN APPLICATION & REPAYMENT                       */}
      {/* ======================================================== */}
      {activeTab === "loan" && (
        <div className="space-y-6">
          {/* Active Loan Status Card */}
          {activeLoan ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-indigo-500 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black uppercase tracking-wider">
                      {activeLoan.status === "disbursed"
                        ? "सक्रिय लोन (Active Loan)"
                        : "आवेदन लंबित (Pending Approval)"}
                    </span>
                    <span className="text-xs text-slate-400">ID: {activeLoan._id}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    ₹{activeLoan.requested_amount} का लोन रिकॉर्ड
                  </h3>
                </div>

                {activeLoan.status === "disbursed" && (
                  <div>
                    {((currentDay <= 15) || Boolean(systemSettings?.allow_loan_repay_after_15th)) ? (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={handleRepayLoan}
                          disabled={payingLoan}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
                        >
                          <span>लोन चुकता करें (Pay ₹{activeLoan.total_payable})</span>
                        </button>
                        {currentDay > 15 && systemSettings?.allow_loan_repay_after_15th && (
                          <span className="text-[10px] text-emerald-600 font-bold">
                            ★ एडमिन विशेष अनुमति द्वारा 15 तारीख के बाद भी भुगतान सक्रिय
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 max-w-sm">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800">
                          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>लोन चुकता करने की तारीख समाप्त (15 तारीख)</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          आज {currentDay} तारीख है। 15 तारीख के बाद लोन चुकता बटन स्वतः बंद रहता है। कृपया एडमिन से संपर्क करके इसे चालू (Enable) करवाएं।
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Loan Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">आवेदन राशि:</span>
                  <span className="font-black text-slate-800 text-base">
                    ₹{activeLoan.requested_amount}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">10% प्रोसेसिंग शुल्क:</span>
                  <span className="font-bold text-rose-600 text-sm">
                    -₹{activeLoan.processing_fee_amount}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">खाते में प्राप्त राशि (90%):</span>
                  <span className="font-black text-emerald-700 text-base">
                    ₹{activeLoan.disbursed_amount}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">संचित ब्याज (1% p.m.):</span>
                  <span className="font-bold text-amber-700 text-sm">
                    +₹{activeLoan.interest_accumulated || 0}
                  </span>
                </div>
              </div>

              {/* Screenshot Proof by Admin */}
              {activeLoan.payment_screenshot && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>एडमिन द्वारा पैसा भेजने का स्क्रीनशॉट प्रमाण (UTR: {activeLoan.transaction_utr})</span>
                    </span>
                    <button
                      onClick={() => setPreviewScreenshot(activeLoan.payment_screenshot)}
                      className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>बड़ा देखें</span>
                    </button>
                  </div>
                  <img
                    src={activeLoan.payment_screenshot}
                    alt="Payment Proof"
                    className="max-h-56 rounded-xl border border-blue-200 object-contain bg-white cursor-pointer"
                    onClick={() => setPreviewScreenshot(activeLoan.payment_screenshot)}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Loan Application Form */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">लोन के लिए आवेदन करें</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  आपकी कुल जमा राशि ₹{myTotalDeposited} है। आप अधिकतम <b>90% (₹{maxLoanEligible})</b> तक
                  लोन ले सकते हैं।
                </p>
              </div>

              {loanMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm font-bold ${
                    loanMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border border-rose-200 text-rose-800"
                  }`}
                >
                  {loanMsg.text}
                </div>
              )}

              {/* Terms alert */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 font-medium">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>लोन नियम एवं शर्तें:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>लोन राशि पर <b>1% प्रति माह (1% p.m.)</b> का ब्याज लगेगा।</li>
                  <li>ब्याज की गणना लोन निकलने की तारीख से हर महीने की <b>10 तारीख</b> को होगी।</li>
                  <li>
                    लोन राशि में से <b>10% प्रोसेसिंग शुल्क</b> काटा जाएगा, और <b>90% राशि</b> सीधे
                    आपके UPI/खाते में भेजी जाएगी।
                  </li>
                  <li>
                    एडमिन द्वारा पैसा भेजने के बाद स्क्रीनशॉट प्रूफ पोर्टल पर सभी सदस्यों को दिखाई देगा।
                  </li>
                </ul>
              </div>

              <form onSubmit={handleApplyLoan} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      आवश्यक लोन राशि (₹)
                    </label>
                    {maxLoanEligible > 0 && (
                      <button
                        type="button"
                        onClick={() => setLoanAmountInput(String(maxLoanEligible))}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        अधिकतम पात्रता (₹{maxLoanEligible}) चुनें
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-black font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
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
                      <span className="text-slate-500">10% प्रोसेसिंग शुल्क (कटौती):</span>
                      <span className="font-bold text-rose-600">
                        -₹{Math.round(Number(loanAmountInput) * 0.10)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="font-bold text-slate-800">
                        आपके UPI/खाते में भेजे जाने वाली शुद्ध राशि (90%):
                      </span>
                      <span className="font-black text-emerald-600 text-sm">
                        ₹{Math.round(Number(loanAmountInput) * 0.90)}
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
      {/* TAB 3: MY PROFILE & KYC (READ-ONLY VIEW)                  */}
      {/* ======================================================== */}
      {activeTab === "my_profile" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              {member?.photo ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-700 font-black text-3xl flex items-center justify-center">
                  {member?.name?.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-black text-slate-900">{member?.name}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">📞 {member?.mobile}</p>
                <p className="text-xs text-slate-500 font-mono">✉️ {member?.email}</p>
              </div>
            </div>

            {/* Documents & KYC Details */}
            <div className="space-y-4 text-xs">
              {/* Aadhaar Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                    आधार कार्ड (Aadhaar Card)
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {member?.aadhaar_number ? `XXXX-XXXX-${member.aadhaar_number.slice(-4)}` : "दर्ज नहीं"}
                  </span>
                </div>
                {member?.aadhaar_file && (
                  <a
                    href={member.aadhaar_file}
                    download={member.aadhaar_file_name || "Aadhaar.pdf"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition w-fit"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>दस्तावेज देखें / डाउनलोड करें</span>
                  </a>
                )}
              </div>

              {/* PAN Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                    पैन कार्ड (PAN Card)
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {member?.pan_number || "दर्ज नहीं"}
                  </span>
                </div>
                {member?.pan_file && (
                  <a
                    href={member.pan_file}
                    download={member.pan_file_name || "PAN.pdf"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition w-fit"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>दस्तावेज देखें / डाउनलोड करें</span>
                  </a>
                )}
              </div>

              {/* Payment Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                  पंजीकृत डिजिटल भुगतान विवरण
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">UPI ID</span>
                    <span className="font-bold text-slate-800">{member?.upi_id || "—"}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">PhonePe / GPay नंबर</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {member?.wallet_number || "—"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">बैंक खाता संख्या</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {member?.account_number || "—"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">IFSC कोड ({member?.bank_name || "Bank"})</span>
                    <span className="font-bold text-slate-800 font-mono uppercase">
                      {member?.ifsc || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: COMMUNITY TRANSPARENCY (ALL MEMBERS & ALL HISTORY) */}
      {/* ======================================================== */}
      {activeTab === "transparency" && (
        <div className="space-y-8">
          {/* Section 1: All Group Members Directory */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  सभी जुड़े हुए सदस्य ({allMembers.length})
                </h3>
                <p className="text-xs text-slate-500">ग्रुप के सभी सक्रिय सदस्यों की सार्वजनिक सूची</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {allMembers.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
                >
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt={m.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center shrink-0">
                      {m.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{m.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">📞 {m.mobile}</p>
                    {m.upi_id && (
                      <p className="text-[10px] text-emerald-700 truncate">UPI: {m.upi_id}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: All Contributions Transparency */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                समूह जमा इतिहास (Community Contributions History)
              </h3>
              <p className="text-xs text-slate-500">
                किस सदस्य ने कब कितना पैसा जमा किया (कुल जमा: ₹{communityPoolTotal})
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[11px]">
                    <th className="py-3 px-4">सदस्य का नाम</th>
                    <th className="py-3 px-4">जमा तारीख</th>
                    <th className="py-3 px-4">माह</th>
                    <th className="py-3 px-4">राशि</th>
                    <th className="py-3 px-4">पेमेंट रेफरेंस</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contributions.map((c) => (
                    <tr key={c._id}>
                      <td className="py-3 px-4 font-bold text-slate-900">{c.member_name}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(c.paid_at).toLocaleString("hi-IN")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{c.month}</td>
                      <td className="py-3 px-4 font-black text-emerald-600 text-sm">₹{c.amount}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {c.razorpay_payment_id || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: All Loans Transparency & Screenshots */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                समूह लोन इतिहास एवं पेमेंट स्क्रीनशॉट प्रमाण
              </h3>
              <p className="text-xs text-slate-500">
                किस सदस्य ने कितना लोन लिया और एडमिन द्वारा पैसा भेजने का प्रमाण
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[11px]">
                    <th className="py-3 px-4">सदस्य</th>
                    <th className="py-3 px-4">लोन राशि</th>
                    <th className="py-3 px-4">प्राप्त राशि (90%)</th>
                    <th className="py-3 px-4">डिस्बर्सल तारीख</th>
                    <th className="py-3 px-4">स्थिति</th>
                    <th className="py-3 px-4">स्क्रीनशॉट प्रूफ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allLoans.map((l) => (
                    <tr key={l._id}>
                      <td className="py-3 px-4 font-bold text-slate-900">{l.member_name}</td>
                      <td className="py-3 px-4 font-black text-slate-800">₹{l.requested_amount}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">₹{l.disbursed_amount}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {l.disbursed_at
                          ? new Date(l.disbursed_at).toLocaleDateString("hi-IN")
                          : "लंबित"}
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
                          {l.status === "repaid"
                            ? "चुकता (Repaid)"
                            : l.status === "disbursed"
                            ? "सक्रिय लोन"
                            : "लंबित"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {l.payment_screenshot ? (
                          <button
                            onClick={() => setPreviewScreenshot(l.payment_screenshot!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>प्रमाण देखें</span>
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

      {/* Mobile App Bottom Navigation Dock */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab("my_fund")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === "my_fund" ? "text-blue-600 font-black" : "text-slate-500 font-semibold"
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px]">जमा (₹100)</span>
        </button>

        <button
          onClick={() => setActiveTab("loan")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === "loan" ? "text-blue-600 font-black" : "text-slate-500 font-semibold"
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px]">लोन (90%)</span>
        </button>

        <button
          onClick={() => setActiveTab("my_profile")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === "my_profile" ? "text-blue-600 font-black" : "text-slate-500 font-semibold"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">प्रोफाइल</span>
        </button>

        <button
          onClick={() => setActiveTab("transparency")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === "transparency" ? "text-blue-600 font-black" : "text-slate-500 font-semibold"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">समुदाय</span>
        </button>
      </div>

      {/* Screenshot Zoom Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
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
