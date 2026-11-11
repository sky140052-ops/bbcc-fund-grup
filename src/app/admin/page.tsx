"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Users,
  UserPlus,
  DollarSign,
  CheckCircle,
  Clock,
  LogOut,
  BookOpen,
  Vote,
  Receipt,
  FileCheck,
  Building,
  Upload,
  Calendar,
  Percent,
} from "lucide-react";

interface Member {
  _id: string;
  name: string;
  role?: string;
  mobile: string;
  dob: string;
  aadhaar_last4: string;
  pan: string;
  bank_details?: {
    account_number: string;
    ifsc: string;
    upi_id: string;
  };
  payment_status: "paid" | "pending";
  has_received_payout: boolean;
}

interface Manager {
  _id: string;
  name: string;
  mobile: string;
  dob: string;
  role: string;
  custom_password?: string;
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
  status: string;
  founder_approved: boolean;
  md_approved: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "managers" | "payouts">("overview");

  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [requests, setRequests] = useState<WithdrawalReq[]>([]);
  const [poolBalance, setPoolBalance] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add Member Form
  const [mName, setMName] = useState("");
  const [mMobile, setMMobile] = useState("");
  const [mDob, setMDob] = useState("");
  const [mAadhaar, setMAadhaar] = useState("");
  const [mPan, setMPan] = useState("");
  const [mAccountNo, setMAccountNo] = useState("");
  const [mIfsc, setMIfsc] = useState("");
  const [mUpi, setMUpi] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberMsg, setMemberMsg] = useState("");

  // Add Manager Form (Founder Only)
  const [mgrName, setMgrName] = useState("");
  const [mgrMobile, setMgrMobile] = useState("");
  const [mgrPassword, setMgrPassword] = useState("");
  const [selectedMemberIdToPromote, setSelectedMemberIdToPromote] = useState("");
  const [addingManager, setAddingManager] = useState(false);
  const [managerMsg, setManagerMsg] = useState("");

  // Payout Disbursal Modal State
  const [selectedReqForPayout, setSelectedReqForPayout] = useState<WithdrawalReq | null>(null);
  const [payoutUtr, setPayoutUtr] = useState("");
  const [payoutScreenshot, setPayoutScreenshot] = useState("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60");
  const [disbursing, setDisbursing] = useState(false);

  const loadData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }
      const authData = await authRes.json();
      if (authData.user?.role !== "founder" && authData.user?.role !== "manager" && authData.user?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setCurrentUser(authData.user);

      // Load group & members
      const grpRes = await fetch("/api/groups");
      const grpData = await grpRes.json();
      setGroup(grpData.group);
      setMembers(grpData.members || []);
      setPoolBalance(grpData.available_pool_balance || 0);
      setTotalCollected(grpData.total_collected_lifetime || 0);

      // Load requests
      const reqRes = await fetch("/api/withdrawal");
      const reqData = await reqRes.json();
      setRequests(reqData.requests || []);

      // Load managers if founder
      if (authData.user?.role === "founder" || authData.user?.role === "admin") {
        const mgrRes = await fetch("/api/admin/managers");
        const mgrData = await mgrRes.json();
        setManagers(mgrData.managers || []);
      }
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

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    setMemberMsg("");

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mName,
          mobile: mMobile,
          dob: mDob,
          aadhaar: mAadhaar,
          pan: mPan,
          bank_details: {
            account_number: mAccountNo,
            ifsc: mIfsc,
            upi_id: mUpi,
          },
          group_id: group?._id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMemberMsg("❌ " + data.error);
        setAddingMember(false);
        return;
      }

      setMemberMsg("✅ " + data.message);
      setMName("");
      setMMobile("");
      setMDob("");
      setMAadhaar("");
      setMPan("");
      setMAccountNo("");
      setMIfsc("");
      setMUpi("");
      loadData();
    } catch {
      setMemberMsg("❌ सदस्य जोड़ने में समस्या आई।");
    } finally {
      setAddingMember(false);
    }
  };

  // Add or Promote Manager
  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingManager(true);
    setManagerMsg("");

    try {
      const payload = selectedMemberIdToPromote
        ? { member_id: selectedMemberIdToPromote, password: mgrPassword }
        : { name: mgrName, mobile: mgrMobile, password: mgrPassword };

      const res = await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setManagerMsg("❌ " + data.error);
        setAddingManager(false);
        return;
      }

      setManagerMsg("✅ " + data.message);
      setMgrName("");
      setMgrMobile("");
      setMgrPassword("");
      setSelectedMemberIdToPromote("");
      loadData();
    } catch {
      setManagerMsg("❌ मैनेजर बनाने में समस्या आई।");
    } finally {
      setAddingManager(false);
    }
  };

  // Approval (Founder or MD)
  const handleApprove = async (requestId: string, roleType: "founder" | "md") => {
    try {
      const res = await fetch("/api/payout/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, role_approval: roleType }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      alert(data.message);
      loadData();
    } catch {
      alert("अप्रूवल दर्ज करने में त्रुटि हुई।");
    }
  };

  // Self Pay Monthly Contribution
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
      alert("✅ आपका मासिक अंशदान (₹" + group.monthly_amount + ") सफलतापूर्वक जमा हो गया!");
      loadData();
    } catch {
      alert("अंशदान दर्ज करने में समस्या आई।");
    }
  };

  // Disburse Funds & Upload Screenshot
  const handleDisbursePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForPayout) return;
    setDisbursing(true);

    try {
      const res = await fetch("/api/payout/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: selectedReqForPayout._id,
          transaction_utr_id: payoutUtr,
          screenshot_url: payoutScreenshot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("❌ " + data.error);
        setDisbursing(false);
        return;
      }

      alert("✅ " + data.message);
      setSelectedReqForPayout(null);
      setPayoutUtr("");
      loadData();
    } catch {
      alert("भुगतान दर्ज करने में त्रुटि हुई।");
    } finally {
      setDisbursing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-600">
        एडमिन पैनल लोड हो रहा है...
      </div>
    );
  }

  const isFounder = currentUser?.role === "founder" || currentUser?.role === "admin";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-amber-300 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>
              {isFounder ? "👑 मुख्य फाउंडर व एडमिन पैनल" : "👔 मैनेजिंग डायरेक्टर (MD) पैनल"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">{currentUser?.name}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
            ग्रुप: {group?.name} • मासिक अंशदान: ₹{group?.monthly_amount} • देय तिथि: हर माह की {group?.due_date_day} तारीख
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

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "overview"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>पूल ओवरव्यू</span>
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "members"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>सदस्य जोड़ें व सूची ({members.length})</span>
        </button>

        {isFounder && (
          <button
            onClick={() => setActiveTab("managers")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === "managers"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>मैनेजर (MD) बनाएं ({managers.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "payouts"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>निकासी, अप्रूवल व भुगतान ({requests.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                उपलब्ध पूल बैलेंस (Available)
              </span>
              <p className="mt-2 text-2xl font-black text-emerald-600">
                ₹{poolBalance.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                निकासी की अधिकतम सीमा यही है
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                कुल जमा फंड (Lifetime)
              </span>
              <p className="mt-2 text-2xl font-black text-slate-900">
                ₹{totalCollected.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                रेज़रपे गेटवे द्वारा सत्यापित
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                इस माह जमा (Paid)
              </span>
              <p className="mt-2 text-2xl font-black text-brand-600">
                {members.filter((m) => m.payment_status === "paid").length} / {members.length} लोग
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                बाकी सदस्य: {members.filter((m) => m.payment_status === "pending").length}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ब्याज दर एवं कटौती
              </span>
              <p className="mt-2 text-xl font-black text-amber-600">₹1 सैकड़ा + ₹20 कट</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                1% प्रतिमाह साधारण ब्याज
              </p>
            </div>
          </div>

          {/* Self Contribution Banner for Founder / MD */}
          {(() => {
            const myRecord = members.find((m) => m._id === currentUser?._id);
            const myStatus = myRecord?.payment_status === "paid";
            return (
              <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                    {isFounder ? "👑 मुख्य फाउंडर का अंशदान" : "👔 MD / मैनेजर का अंशदान"}
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    मासिक अंशदान स्टेटस:{" "}
                    {myStatus ? (
                      <span className="text-emerald-700 font-bold">जमा है (PAID) ✅</span>
                    ) : (
                      <span className="text-rose-700 font-bold">बाकी है (PENDING) ⏳</span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    {isFounder ? "फाउंडर" : "MD"} भी ग्रुप के सदस्य के रूप में हर माह ₹
                    {group?.monthly_amount} जमा करता है।
                  </p>
                </div>

                {!myStatus && (
                  <button
                    onClick={handlePayContribution}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition whitespace-nowrap"
                  >
                    रेज़रपे से अपना ₹{group?.monthly_amount} जमा करें
                  </button>
                )}
              </div>
            );
          })()}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-black text-slate-900 mb-2">
              फाउंडर एवं मैनेजिंग डायरेक्टर की जिम्मेदारियां
            </h3>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside font-medium leading-relaxed">
              <li>दोनों (फाउंडर व MD) नए सदस्यों का आधार व पैन कार्ड डालकर जोड़ सकते हैं।</li>
              <li>फंड निकासी रिक्वेस्ट पर दोनों का डिजिटल अप्रूवल आवश्यक है।</li>
              <li>
                <strong>फाउंडर</strong> नेट अमाउंट (₹20 काटकर) बैंक/UPI से ट्रांसफर करेगा और स्क्रीनशॉट व UTR पोर्टल पर अपलोड करेगा।
              </li>
              <li>पैसे ट्रांसफर होते ही सिस्टम स्वतः ₹1 सैकड़ा प्रतिमाह ब्याज की गणना शुरू कर देगा।</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Members & KYC */}
      {activeTab === "members" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Member Form */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-600" />
                <span>नया सदस्य जोड़ें (Add Member)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                क्लाइंट अपने मोबाइल व जन्मतिथि से लॉगिन करेगा।
              </p>
            </div>

            {memberMsg && (
              <div className="p-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-800">
                {memberMsg}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">पूरा नाम</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. राहुल शर्मा"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">मोबाइल नंबर</label>
                  <input
                    type="tel"
                    required
                    placeholder="उदा. 9811122233"
                    value={mMobile}
                    onChange={(e) => setMMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">जन्मतिथि (DOB)</label>
                  <input
                    type="text"
                    required
                    placeholder="DDMMYYYY (01011995)"
                    value={mDob}
                    onChange={(e) => setMDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">आधार कार्ड नंबर</label>
                  <input
                    type="text"
                    required
                    placeholder="12 अंकों का आधार"
                    value={mAadhaar}
                    onChange={(e) => setMAadhaar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">पैन कार्ड नंबर</label>
                  <input
                    type="text"
                    required
                    placeholder="10 अक्षरों का पैन"
                    value={mPan}
                    onChange={(e) => setMPan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">बैंक खाता नंबर (Payout)</label>
                <input
                  type="text"
                  placeholder="अकाउंट नंबर"
                  value={mAccountNo}
                  onChange={(e) => setMAccountNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC कोड</label>
                  <input
                    type="text"
                    placeholder="SBIN0001234"
                    value={mIfsc}
                    onChange={(e) => setMIfsc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    placeholder="name@upi"
                    value={mUpi}
                    onChange={(e) => setMUpi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addingMember}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                {addingMember ? "जोड़ा जा रहा है..." : "सदस्य जोड़ें (Save Member)"}
              </button>
            </form>
          </div>

          {/* Members Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                पंजीकृत सदस्यों की सूची ({members.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">नाम</th>
                    <th className="py-3 px-4">मोबाइल</th>
                    <th className="py-3 px-4">जन्मतिथि</th>
                    <th className="py-3 px-4">पैन / आधार</th>
                    <th className="py-3 px-4">स्टेटस</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {members.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <span>{m.name}</span>
                        {m.role === "founder" && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black">
                            👑 फाउंडर
                          </span>
                        )}
                        {m.role === "manager" && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-black">
                            👔 MD
                          </span>
                        )}
                        {(!m.role || m.role === "member") && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                            👤 सदस्य
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{m.mobile}</td>
                      <td className="py-3 px-4 text-slate-500">{m.dob}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {m.pan} / XXXX-{m.aadhaar_last4}
                      </td>
                      <td className="py-3 px-4">
                        {m.payment_status === "paid" ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            जमा है
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            बाकी है
                          </span>
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

      {/* Tab 3: Managers (Founder Only) */}
      {activeTab === "managers" && isFounder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>नया मैनेजर (MD) जोड़ें</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                मैनेजर भी क्लाइंट जोड़ सकता है और निकासी अप्रूव कर सकता है।
              </p>
            </div>

            {managerMsg && (
              <div className="p-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-800">
                {managerMsg}
              </div>
            )}

            <form onSubmit={handleAddManager} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  विकल्प 1: किसी मौजूदा क्लाइंट को MD बनाएं
                </label>
                <select
                  value={selectedMemberIdToPromote}
                  onChange={(e) => {
                    setSelectedMemberIdToPromote(e.target.value);
                    if (e.target.value) {
                      setMgrName("");
                      setMgrMobile("");
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                >
                  <option value="">-- क्लाइंट चुनें (या नीचे नया बनाएं) --</option>
                  {members
                    .filter((m) => m.role !== "founder" && m.role !== "manager")
                    .map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.mobile})
                      </option>
                    ))}
                </select>
              </div>

              {!selectedMemberIdToPromote && (
                <>
                  <div className="pt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                    — अथवा नया MD विवरण दर्ज करें —
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">मैनेजर का नाम</label>
                    <input
                      type="text"
                      required={!selectedMemberIdToPromote}
                      placeholder="उदा. रमेश कुमार (MD)"
                      value={mgrName}
                      onChange={(e) => setMgrName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      लॉगिन मोबाइल नंबर / आईडी
                    </label>
                    <input
                      type="tel"
                      required={!selectedMemberIdToPromote}
                      placeholder="उदा. 9876543210"
                      value={mgrMobile}
                      onChange={(e) => setMgrMobile(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  मैनेजर लॉगिन पासवर्ड
                </label>
                <input
                  type="text"
                  required
                  placeholder="नया पासवर्ड सेट करें"
                  value={mgrPassword}
                  onChange={(e) => setMgrPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={addingManager}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                {addingManager
                  ? "प्रोसेस हो रहा है..."
                  : selectedMemberIdToPromote
                  ? "चुने गए सदस्य को MD बनाएं"
                  : "नया मैनेजर बनाएं"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-black text-slate-900 mb-4">
              सक्रिय मैनेजर सूची ({managers.length})
            </h3>
            <div className="space-y-3">
              {managers.map((mgr) => (
                <div
                  key={mgr._id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{mgr.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">मोबाइल: {mgr.mobile}</p>
                    <p className="text-xs text-indigo-700 font-bold mt-0.5">
                      पासवर्ड: {mgr.custom_password || "******"}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-black rounded-full">
                    MD / Manager
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Withdrawal, Approvals & Disbursal */}
      {activeTab === "payouts" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Vote className="w-5 h-5 text-purple-600" />
                  <span>सक्रिय निकासी रिक्वेस्ट एवं डुअल अप्रूवल</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  वोटिंग के बाद फाउंडर एवं MD दोनों के अप्रूवल पर ही भुगतान संभव है।
                </p>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium bg-slate-50 rounded-2xl">
                वर्तमान में कोई पेंडिंग निकासी रिक्वेस्ट नहीं है।
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((r) => {
                  const bothApproved = r.founder_approved && r.md_approved;
                  return (
                    <div
                      key={r._id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-base">{r.user_name}</span>
                          <span className="text-xs font-black px-2.5 py-0.5 bg-brand-100 text-brand-800 rounded-md">
                            मांग: ₹{r.requested_amount.toLocaleString()}
                          </span>
                          <span className="text-xs font-black px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-md">
                            ₹20 कटकर: ₹{r.net_payable_amount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">कारण: {r.reason}</p>
                        <p className="text-xs text-emerald-700 font-bold">
                          लौटाने की तारीख: {r.repayment_due_date} ({r.repayment_duration_days} दिन) •
                          ब्याज: ₹1 सैकड़ा प्रतिमाह
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            {r.votes_count} वोट प्राप्त
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              r.founder_approved
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            फाउंडर अप्रूवल: {r.founder_approved ? "स्वीकृत ✅" : "बाकी ⏳"}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              r.md_approved
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            MD अप्रूवल: {r.md_approved ? "स्वीकृत ✅" : "बाकी ⏳"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                        {isFounder && !r.founder_approved && (
                          <button
                            onClick={() => handleApprove(r._id, "founder")}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                          >
                            फाउंडर साइन-ऑफ (Approve)
                          </button>
                        )}

                        {!isFounder && !r.md_approved && (
                          <button
                            onClick={() => handleApprove(r._id, "md")}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                          >
                            MD साइन-ऑफ (Approve)
                          </button>
                        )}

                        {bothApproved && r.status !== "disbursed" && isFounder && (
                          <button
                            onClick={() => setSelectedReqForPayout(r)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>भुगतान करें व स्क्रीनशॉट डालें</span>
                          </button>
                        )}

                        {r.status === "disbursed" && (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl">
                            भुगतान पूर्ण (Disbursed)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal / Action Card for Founder Disbursal & Screenshot Upload */}
          {selectedReqForPayout && (
            <div className="bg-white rounded-3xl border-2 border-brand-500 shadow-xl p-6 sm:p-8 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-black uppercase text-brand-600 tracking-wider">
                    फाउंडर भुगतान व स्क्रीनशॉट प्रमाण
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {selectedReqForPayout.user_name} को भुगतान जारी करें
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    कुल मांग: ₹{selectedReqForPayout.requested_amount.toLocaleString()} • ₹20 काटकर
                    भेजें:{" "}
                    <strong className="text-emerald-700 text-sm">
                      ₹{selectedReqForPayout.net_payable_amount.toLocaleString()}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReqForPayout(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕ बंद करें
                </button>
              </div>

              <form onSubmit={handleDisbursePayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    पेमेंट ट्रांजैक्शन UTR नंबर (Bank/UPI Ref No.)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. UPI/493820194820 या IMPS129482"
                    value={payoutUtr}
                    onChange={(e) => setPayoutUtr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    पेमेंट का स्क्रीनशॉट URL / इमेज लिंक
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="स्क्रीनशॉट का URL"
                    value={payoutScreenshot}
                    onChange={(e) => setPayoutScreenshot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    यह स्क्रीनशॉट ग्रुप के सभी सदस्यों को पारदर्शी रूप से उनके डैशबोर्ड पर दिखेगा।
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl text-xs font-bold text-amber-900">
                  ⚠️ भुगतान दर्ज होते ही सदस्य से ₹1 सैकड़ा प्रतिमाह ब्याज की गणना शुरू हो जाएगी।
                </div>

                <button
                  type="submit"
                  disabled={disbursing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  {disbursing ? "दर्ज हो रहा है..." : "भुगतान दर्ज करें एवं स्क्रीनशॉट सेव करें"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
