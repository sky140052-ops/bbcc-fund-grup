"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CreditCard,
  Vote,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Percent,
  Receipt,
  FileText,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface Member {
  _id: string;
  name: string;
  mobile: string;
  aadhaar_last4: string;
  pan: string;
  payment_status: "paid" | "pending";
  paid_amount: number;
  paid_at?: string;
  has_received_payout: boolean;
}

interface GroupData {
  _id: string;
  name: string;
  monthly_amount: number;
  due_date_day: number;
  total_cycle_months: number;
  current_cycle_month: number;
}

interface WithdrawalReq {
  _id: string;
  user_id: string;
  user_name: string;
  requested_amount: number;
  deduction_fee: number;
  net_payable_amount: number;
  reason: string;
  repayment_due_date: string;
  repayment_duration_days: number;
  votes_count: number;
  has_user_voted?: boolean;
  status: string;
  founder_approved: boolean;
  md_approved: boolean;
}

interface PayoutItem {
  _id: string;
  recipient_name: string;
  gross_amount: number;
  deduction_fee: number;
  net_disbursed_amount: number;
  disbursed_at: string;
  payment_screenshot_url: string;
  transaction_utr_id: string;
  repayment_due_date: string;
}

export default function MemberDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [availablePool, setAvailablePool] = useState(0);
  const [requests, setRequests] = useState<WithdrawalReq[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal Form State
  const [reqAmount, setReqAmount] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [repayDays, setRepayDays] = useState("30");
  const [repayDate, setRepayDate] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const loadData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }
      const authData = await authRes.json();
      setCurrentUser(authData.user);

      const groupRes = await fetch("/api/groups");
      const groupData = await groupRes.json();
      setGroup(groupData.group);
      setMembers(groupData.members || []);
      setAvailablePool(groupData.available_pool_balance || 0);

      const reqRes = await fetch("/api/withdrawal");
      const reqData = await reqRes.json();
      setRequests(reqData.requests || []);
      setPayouts(reqData.payouts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // Handle Monthly Payment (Razorpay simulation)
  const handlePayContribution = async () => {
    if (!group) return;
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: group._id,
          amount: group.monthly_amount,
          razorpay_payment_id: `rzp_pay_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      alert("✅ रेज़रपे द्वारा ₹" + group.monthly_amount + " अंशदान सफलतापूर्वक जमा हो गया!");
      loadData();
    } catch {
      alert("भुगतान करने में त्रुटि हुई।");
    }
  };

  // Handle Submit Withdrawal Request
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    setSubmittingReq(true);
    setFeedbackMsg("");

    try {
      const res = await fetch("/api/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: group._id,
          requested_amount: Number(reqAmount),
          reason: reqReason,
          repayment_duration_days: Number(repayDays),
          repayment_due_date: repayDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedbackMsg("❌ " + data.error);
        setSubmittingReq(false);
        return;
      }

      setFeedbackMsg("✅ " + data.message);
      setReqAmount("");
      setReqReason("");
      loadData();
    } catch {
      setFeedbackMsg("❌ रिक्वेस्ट दर्ज करने में त्रुटि हुई।");
    } finally {
      setSubmittingReq(false);
    }
  };

  // Handle Vote
  const handleVote = async (requestId: string) => {
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      alert(data.message);
      loadData();
    } catch {
      alert("वोट दर्ज करने में त्रुटि हुई।");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center font-bold text-slate-600 animate-pulse">
          BBCC Fund डेटा लोड हो रहा है...
        </div>
      </div>
    );
  }

  const myMemberInfo = members.find((m) => m._id === currentUser?._id);
  const isPaidThisMonth = myMemberInfo?.payment_status === "paid";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-sky-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>सदस्य पोर्टल (Client Dashboard)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">नमस्ते, {currentUser?.name}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
            मोबाइल: {currentUser?.mobile} • पैन: {currentUser?.pan || "N/A"} • आधार: XXXX-XXXX-
            {currentUser?.aadhaar_last4 || "XXXX"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/rules"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            नियम व शर्तें
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              मासिक अंशदान
            </span>
            <Calendar className="w-5 h-5 text-brand-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            ₹{group?.monthly_amount?.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            हर महीने की {group?.due_date_day} तारीख तक देय
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              उपलब्ध पूल बैलेंस (Max Limit)
            </span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            ₹{availablePool.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">
            निकासी सीमा: अधिकतम उपलब्ध बैलेंस
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              मेरा भुगतान स्टेटस
            </span>
            <CreditCard className="w-5 h-5 text-sky-600" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            {isPaidThisMonth ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> जमा है (PAID)
              </span>
            ) : (
              <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-full flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> बाकी है (PENDING)
              </span>
            )}
          </div>
          {!isPaidThisMonth && (
            <button
              onClick={handlePayContribution}
              className="mt-3 w-full py-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              रेज़रपे से अभी जमा करें (₹{group?.monthly_amount})
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              लागू ब्याज दर
            </span>
            <Percent className="w-5 h-5 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">₹1 सैकड़ा / माह</p>
          <p className="mt-1 text-xs text-amber-700 font-medium">
            1% प्रतिमाह (पेमेंट मिलने के दिन से शुरू)
          </p>
        </div>
      </div>

      {/* Main Grid: Left = Group Transparency Directory; Right = Need Request & Voting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Group Transparency Table (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Members Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-600" />
                  <span>ग्रुप के सदस्य एवं पारदर्शी स्थिति ({members.length} लोग)</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  सभी सदस्यों का इस महीने का भुगतान स्टेटस स्पष्ट रूप से देखा जा सकता है।
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">सदस्य का नाम</th>
                    <th className="py-3 px-4">मोबाइल नंबर</th>
                    <th className="py-3 px-4">पैन नंबर</th>
                    <th className="py-3 px-4">इस माह का स्टेटस</th>
                    <th className="py-3 px-4">पूल फंड लिया?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {members.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <span>{m.name}</span>
                        {m._id === currentUser?._id && (
                          <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-black">
                            आप
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{m.mobile}</td>
                      <td className="py-3 px-4 text-slate-500 uppercase">{m.pan}</td>
                      <td className="py-3 px-4">
                        {m.payment_status === "paid" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> जमा है
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Clock className="w-3 h-3" /> बाकी है
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {m.has_received_payout ? (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            प्राप्त हुआ
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">नहीं लिया</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Community Voting Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Vote className="w-5 h-5 text-purple-600" />
                  <span>सक्रिय निकासी रिक्वेस्ट व वोटिंग (Community Voting)</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  ज़रूरतमंद सदस्य को वोट दें। (प्रत्येक सदस्य केवल 1 वोट दे सकता है)
                </p>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                वर्तमान में कोई सक्रिय निकासी रिक्वेस्ट नहीं है।
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((r) => (
                  <div
                    key={r._id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-base">{r.user_name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md">
                          मांग: ₹{r.requested_amount.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md">
                          ₹20 कटौती उपरांत: ₹{r.net_payable_amount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        <strong>कारण:</strong> {r.reason}
                      </p>
                      <p className="text-xs text-emerald-700 font-bold">
                        📅 लौटाने की तारीख: {r.repayment_due_date} ({r.repayment_duration_days} दिन) •
                        ब्याज: ₹1 सैकड़ा/माह
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-center px-4 py-1.5 bg-purple-50 border border-purple-200 rounded-xl">
                        <span className="block text-base font-black text-purple-700">
                          {r.votes_count}
                        </span>
                        <span className="text-[10px] font-bold text-purple-600 uppercase">वोट</span>
                      </div>

                      {r.user_id !== currentUser?._id && (
                        <button
                          onClick={() => handleVote(r._id)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                        >
                          वोट दें
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Disbursals & Proof Screenshots */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-sky-600" />
              <span>फाउंडर भुगतान प्रमाण व स्क्रीनशॉट (Payment Proofs)</span>
            </h2>

            {payouts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
                अभी तक कोई भुगतान निर्गत नहीं हुआ है।
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {payouts.map((p) => (
                  <div key={p._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{p.recipient_name}</h4>
                        <p className="text-xs text-slate-500 font-medium">
                          भेजी गई शुद्ध राशि: ₹{p.net_disbursed_amount.toLocaleString()} (₹20 काटकर)
                        </p>
                        <p className="text-xs text-slate-600 font-mono mt-1">
                          UTR: {p.transaction_utr_id}
                        </p>
                        <p className="text-xs text-emerald-600 font-bold mt-0.5">
                          लौटाने की तारीख: {p.repayment_due_date}
                        </p>
                      </div>
                    </div>
                    {p.payment_screenshot_url && (
                      <a
                        href={p.payment_screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>पेमेंट स्क्रीनशॉट देखें</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Emergency Fund Request Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="mb-4">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                इमर्जेंसी सहायता
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                फंड निकासी आवेदन (Need Request)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                नियम: आप अधिकतम ₹{availablePool.toLocaleString()} (पूल बैलेंस) तक ही मांग सकते हैं।
              </p>
            </div>

            {feedbackMsg && (
              <div className="mb-4 p-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-800">
                {feedbackMsg}
              </div>
            )}

            <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  मांग की जाने वाली राशि (₹)
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  max={availablePool}
                  placeholder={`अधिकतम ₹${availablePool}`}
                  value={reqAmount}
                  onChange={(e) => setReqAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {reqAmount && Number(reqAmount) > 0 && (
                  <div className="mt-1.5 p-2 bg-amber-50 rounded-lg text-[11px] font-bold text-amber-800 space-y-0.5">
                    <p>• ₹20 कटौती उपरांत मिलेंगे: ₹{(Number(reqAmount) - 20).toLocaleString()}</p>
                    <p>• ब्याज: ₹{(Number(reqAmount) * 0.01).toFixed(0)} प्रति माह (₹1 सैकड़ा)</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  आवश्यकता का कारण
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="उदा. चिकित्सा खर्च, व्यापार, पारिवारिक कार्य"
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    कितने दिन में लौटाएंगे?
                  </label>
                  <select
                    value={repayDays}
                    onChange={(e) => {
                      setRepayDays(e.target.value);
                      const target = new Date(Date.now() + 86400000 * Number(e.target.value))
                        .toISOString()
                        .split("T")[0];
                      setRepayDate(target);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold focus:outline-none"
                  >
                    <option value="30">30 दिन (1 माह)</option>
                    <option value="60">60 दिन (2 माह)</option>
                    <option value="90">90 दिन (3 माह)</option>
                    <option value="180">180 दिन (6 माह)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    लौटाने की पक्की तारीख
                  </label>
                  <input
                    type="date"
                    required
                    value={repayDate}
                    onChange={(e) => setRepayDate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingReq || availablePool <= 0}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                {submittingReq ? "दर्ज हो रहा है..." : "आवेदन सबमिट करें (Submit Request)"}
              </button>
            </form>
          </div>

          {/* Hindi Rules Reminder Box */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 text-amber-950">
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>नियम स्मरण पत्र (BBCC Rules)</span>
            </h4>
            <ul className="mt-2.5 space-y-1.5 text-xs font-medium text-amber-900 leading-relaxed list-disc list-inside">
              <li>मांग केवल पूल में उपलब्ध कुल राशि तक ही संभव है।</li>
              <li>स्वीकृत राशि में से ₹20 कटकर फाउंडर द्वारा भेजी जाएगी।</li>
              <li>पैसे मिलने के दिन से ₹1 सैकड़ा प्रतिमाह ब्याज जुड़ेगा।</li>
              <li>ग्रुप मेंबर्स की वोटिंग और फाउंडर + MD अप्रूवल अनिवार्य है।</li>
            </ul>
            <Link
              href="/rules"
              className="mt-3 block text-center text-xs font-bold text-brand-700 hover:underline"
            >
              पूर्ण 9 नियम यहाँ पढ़ें →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
