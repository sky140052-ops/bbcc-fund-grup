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
  Building,
  Eye,
  X,
  UserCheck,
  FileCheck,
} from "lucide-react";

interface Member {
  _id: string;
  name: string;
  mobile: string;
  aadhaar_last4: string;
  pan: string;
  membership_status?: "pending" | "approved" | "rejected";
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
  max_members?: number;
  description?: string;
  approved_members_count?: number;
  pending_members_count?: number;
  user_status?: "approved" | "pending" | "rejected" | "none";
  available_pool?: number;
  status?: string;
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
  const [allGroups, setAllGroups] = useState<GroupData[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [availablePool, setAvailablePool] = useState(0);
  const [requests, setRequests] = useState<WithdrawalReq[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [joinGroupMsg, setJoinGroupMsg] = useState<{ [key: string]: string }>({});

  // Withdrawal Form State
  const [reqAmount, setReqAmount] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [repayDays, setRepayDays] = useState("30");
  const [repayDate, setRepayDate] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [showMyKycModal, setShowMyKycModal] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; title: string } | null>(null);

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
      setAllGroups(groupData.groups || (groupData.group ? [groupData.group] : []));
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

  // Handle Apply to Join another Group
  const handleApplyToJoin = async (groupId: string) => {
    setJoiningGroupId(groupId);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinGroupMsg({ ...joinGroupMsg, [groupId]: `❌ ${data.error}` });
      } else {
        setJoinGroupMsg({ ...joinGroupMsg, [groupId]: `✅ ${data.message}` });
        loadData();
      }
    } catch {
      setJoinGroupMsg({ ...joinGroupMsg, [groupId]: "❌ आवेदन भेजने में समस्या आई।" });
    } finally {
      setJoiningGroupId(null);
    }
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

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowMyKycModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>मेरा KYC प्रोफाइल 📁</span>
          </button>
          <Link
            href="/rules"
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            नियम व शर्तें
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* Pending Membership Alert Banner */}
      {myMemberInfo?.membership_status === "pending" && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 flex items-start gap-4 text-amber-900 shadow-sm">
          <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-sm">आपका आवेदन एडमिन के पास समीक्षाधीन है (Pending Approval)</h4>
            <p className="text-xs text-amber-800 mt-1 font-medium leading-relaxed">
              मुख्य एडमिन द्वारा आपके आवेदन को स्वीकार (Approve) किए जाने के बाद ही आप मासिक अंशदान जमा कर सकेंगे एवं निकासी के लिए वोट कर सकेंगे।
            </p>
          </div>
        </div>
      )}

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

      {/* AVAILABLE FUND GROUPS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-600 mb-0.5">
              <Building className="w-4 h-4" />
              <span>एडमिन द्वारा संचालित फंड ग्रुप्स</span>
            </div>
            <h3 className="text-base font-black text-slate-900">
              उपलब्ध फंड ग्रुप्स व आपकी सदस्यता स्थिति ({allGroups.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            आप किसी भी अन्य ग्रुप में जुड़ने का आवेदन कर सकते हैं।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allGroups.map((g) => {
            const isJoined = g.user_status === "approved";
            const isPending = g.user_status === "pending";
            const msg = joinGroupMsg[g._id];

            return (
              <div
                key={g._id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{g.name}</h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase">
                      {g.status || "active"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium mt-1.5 line-clamp-2">
                    {g.description || "मासिक बचत व आपातकालीन सहायता समूह।"}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-3">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">मासिक</span>
                      <span className="font-black text-slate-900">₹{g.monthly_amount?.toLocaleString()}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">देय तारीख</span>
                      <span className="font-black text-slate-900">{g.due_date_day} तारीख</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">अवधि</span>
                      <span className="font-black text-slate-800">{g.total_cycle_months} माह</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">सदस्य</span>
                      <span className="font-black text-slate-800">{g.approved_members_count || 1}/{g.max_members || 12}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  {msg && (
                    <div className="mb-2 p-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200">
                      {msg}
                    </div>
                  )}

                  {isJoined ? (
                    <div className="w-full py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>आप सक्रिय सदस्य हैं ✅</span>
                    </div>
                  ) : isPending ? (
                    <div className="w-full py-2 bg-amber-50 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>आवेदन लंबित है (Pending) ⏳</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApplyToJoin(g._id)}
                      disabled={joiningGroupId === g._id}
                      className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                    >
                      {joiningGroupId === g._id ? "आवेदन भेजा जा रहा है..." : "इस ग्रुप से जुड़ें (Apply to Join)"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
                    <th className="py-3 px-4">अंशदान स्थिति</th>
                    <th className="py-3 px-4">जमा तारीख (Date)</th>
                    <th className="py-3 px-4">जमा राशि</th>
                    <th className="py-3 px-4">पूल फंड लाभ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {members.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{m.name}</span>
                          {m._id === currentUser?._id && (
                            <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-black">
                              आप
                            </span>
                          )}
                        </div>
                      </td>
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
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                        {m.paid_at
                          ? new Date(m.paid_at).toLocaleDateString("hi-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-xs font-black text-slate-900">
                        {m.payment_status === "paid" ? `₹${m.paid_amount || group?.monthly_amount || 0}` : "—"}
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

      {/* My KYC Profile Modal */}
      {showMyKycModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                  🔒 आपकी निजी KYC प्रोफाइल
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {currentUser?.name} की आधिकारिक प्रोफाइल
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  आपकी व्यक्तिगत जानकारी पूरी तरह सुरक्षित है और किसी अन्य सदस्य को नहीं दिखाई जाती।
                </p>
              </div>
              <button
                onClick={() => setShowMyKycModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Card with Live Photo */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              {currentUser?.photo_live ? (
                <img
                  src={currentUser.photo_live}
                  alt="My Live Photo"
                  className="w-24 h-24 object-cover rounded-2xl border-2 border-brand-500 shadow-md cursor-pointer hover:opacity-90"
                  onClick={() => setEnlargedImage({ url: currentUser.photo_live, title: "मेरी लाइव फोटो" })}
                />
              ) : (
                <div className="w-24 h-24 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold text-center p-2">
                  लाइव फोटो उपलब्ध नहीं
                </div>
              )}
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-lg font-black text-slate-900">{currentUser?.name}</h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    सत्यापित सदस्य
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  ईमेल: {currentUser?.email} • मोबाइल: {currentUser?.mobile}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  जन्मतिथि: {currentUser?.dob || "—"} • लिंग: {currentUser?.gender || "—"} ({currentUser?.marital_status || "—"})
                </p>
              </div>
            </div>

            {/* Family & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">पारिवारिक व वित्तीय जानकारी</span>
                <p><strong>पिता / पति:</strong> {currentUser?.father_name || "—"}</p>
                <p><strong>व्यवसाय:</strong> {currentUser?.occupation || "—"}</p>
                <p><strong>मासिक आय:</strong> ₹{currentUser?.monthly_income || "—"}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">स्थाई पता</span>
                <p>{currentUser?.address || "—"}</p>
                <p><strong>शहर:</strong> {currentUser?.city || "—"} - {currentUser?.pincode || "—"}</p>
              </div>
            </div>

            {/* Nominee & Bank Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">वारिस (Nominee)</span>
                <p><strong>नाम:</strong> {currentUser?.nominee_name || "—"}</p>
                <p><strong>संबंध:</strong> {currentUser?.nominee_relation || "—"}</p>
                <p><strong>मोबाइल:</strong> {currentUser?.nominee_mobile || "—"}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">बैंक विवरण (Payout)</span>
                <p><strong>खाता संख्या:</strong> {currentUser?.bank_details?.account_number || "—"}</p>
                <p><strong>IFSC:</strong> {currentUser?.bank_details?.ifsc || "—"}</p>
                <p><strong>UPI ID:</strong> {currentUser?.bank_details?.upi_id || "—"}</p>
              </div>
            </div>

            {/* Documents Preview */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                मेरे संलग्न दस्तावेज (Uploaded Documents)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">आधार कार्ड (Front)</span>
                  {currentUser?.aadhaar_front ? (
                    <img
                      src={currentUser.aadhaar_front}
                      alt="Aadhaar Front"
                      className="w-full h-24 object-contain bg-white rounded-lg border border-slate-300 p-0.5 cursor-pointer hover:opacity-90"
                      onClick={() => setEnlargedImage({ url: currentUser.aadhaar_front, title: "आधार कार्ड (Front)" })}
                    />
                  ) : (
                    <div className="w-full h-24 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
                      अपलोड नहीं है
                    </div>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">आधार कार्ड (Back)</span>
                  {currentUser?.aadhaar_back ? (
                    <img
                      src={currentUser.aadhaar_back}
                      alt="Aadhaar Back"
                      className="w-full h-24 object-contain bg-white rounded-lg border border-slate-300 p-0.5 cursor-pointer hover:opacity-90"
                      onClick={() => setEnlargedImage({ url: currentUser.aadhaar_back, title: "आधार कार्ड (Back)" })}
                    />
                  ) : (
                    <div className="w-full h-24 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
                      अपलोड नहीं है
                    </div>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500 font-bold">पैन कार्ड ({currentUser?.pan_type || "PAN"})</span>
                  </div>
                  {currentUser?.pan_document ? (
                    <img
                      src={currentUser.pan_document}
                      alt="PAN Document"
                      className="w-full h-24 object-contain bg-white rounded-lg border border-slate-300 p-0.5 cursor-pointer hover:opacity-90"
                      onClick={() => setEnlargedImage({ url: currentUser.pan_document, title: "पैन कार्ड दस्तावेज" })}
                    />
                  ) : (
                    <div className="w-full h-24 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
                      अपलोड नहीं है
                    </div>
                  )}
                  {currentUser?.pan_type === "epan" && currentUser?.epan_password && (
                    <div className="mt-1 text-[10px] bg-amber-100 text-amber-900 rounded p-1 font-mono font-bold">
                      पासवर्ड: {currentUser.epan_password}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowMyKycModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Preview Modal */}
      {enlargedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full space-y-3">
            <div className="flex items-center justify-between text-white">
              <span className="font-bold text-sm">{enlargedImage.title}</span>
              <button
                onClick={() => setEnlargedImage(null)}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-black rounded-2xl overflow-hidden flex items-center justify-center max-h-[80vh]">
              <img
                src={enlargedImage.url}
                alt={enlargedImage.title}
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
