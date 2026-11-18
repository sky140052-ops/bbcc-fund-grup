"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Users,
  Building,
  CheckCircle,
  Clock,
  LogOut,
  BookOpen,
  Vote,
  Receipt,
  FileCheck,
  Upload,
  Calendar,
  Percent,
  Eye,
  X,
  Search,
  Edit,
  Trash2,
  DollarSign,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react";

interface GroupData {
  _id: string;
  name: string;
  monthly_amount: number;
  due_date_day: number;
  start_date?: string;
  end_date?: string;
  total_cycle_months: number;
  current_cycle_month: number;
  max_members?: number;
  description?: string;
  approved_members_count?: number;
  pending_members_count?: number;
  status?: string;
}

interface ApplicationItem {
  _id: string;
  group_id: string;
  group_name: string;
  monthly_amount: number;
  user_id: string;
  user_name: string;
  user_email: string;
  user_mobile: string;
  user_dob: string;
  user_pan: string;
  user_aadhaar_last4: string;
  father_name?: string;
  gender?: string;
  marital_status?: string;
  address?: string;
  city?: string;
  pincode?: string;
  occupation?: string;
  monthly_income?: string;
  nominee_name?: string;
  nominee_relation?: string;
  nominee_mobile?: string;
  photo_live?: string;
  aadhaar_front?: string;
  aadhaar_back?: string;
  pan_type?: "physical" | "epan";
  pan_document?: string;
  epan_password?: string;
  bank_details?: {
    account_number: string;
    ifsc: string;
    upi_id: string;
  };
  status: "pending" | "approved" | "rejected";
  joined_at: string;
}

interface ClientUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  dob: string;
  role: string;
  pan: string;
  aadhaar_last4: string;
  father_name?: string;
  address?: string;
  city?: string;
  pincode?: string;
  occupation?: string;
  monthly_income?: string;
  nominee_name?: string;
  nominee_relation?: string;
  nominee_mobile?: string;
  bank_details?: {
    account_number: string;
    ifsc: string;
    upi_id: string;
  };
  created_at: string;
}

interface WithdrawalReq {
  _id: string;
  group_id: string;
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
  admin_approved?: boolean;
  disbursed_at?: string;
  transaction_utr_id?: string;
  payment_screenshot_url?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "groups" | "approvals" | "collections" | "clients" | "loans"
  >("groups");

  const [allGroups, setAllGroups] = useState<GroupData[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [requests, setRequests] = useState<WithdrawalReq[]>([]);
  const [loading, setLoading] = useState(true);

  // TAB 1: Create Group Form
  const [gName, setGName] = useState("");
  const [gAmount, setGAmount] = useState("10");
  const [gDueDate, setGDueDate] = useState("5");
  const [gStartDate, setGStartDate] = useState("");
  const [gEndDate, setGEndDate] = useState("");
  const [gCycleMonths, setGCycleMonths] = useState("12");
  const [gMaxMembers, setGMaxMembers] = useState("12");
  const [gDesc, setGDesc] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupMsg, setCreateGroupMsg] = useState("");

  // TAB 2: Approvals Modal & Actions
  const [inspectingApp, setInspectingApp] = useState<ApplicationItem | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; title: string } | null>(null);
  const [handlingAppId, setHandlingAppId] = useState<string | null>(null);

  // TAB 3: Group Collections View
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupTotalCollected, setGroupTotalCollected] = useState(0);
  const [groupPoolBalance, setGroupPoolBalance] = useState(0);

  // TAB 4: Client Search, Edit & Delete
  const [searchMobile, setSearchMobile] = useState("");
  const [clientsList, setClientsList] = useState<ClientUser[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientUser | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [updatingClient, setUpdatingClient] = useState(false);
  const [clientActionMsg, setClientActionMsg] = useState("");

  // TAB 5: Loan Disbursal Modal & Screenshot
  const [selectedReqForPayout, setSelectedReqForPayout] = useState<WithdrawalReq | null>(null);
  const [payoutUtr, setPayoutUtr] = useState("");
  const [payoutScreenshot, setPayoutScreenshot] = useState(
    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60"
  );
  const [disbursing, setDisbursing] = useState(false);

  const loadData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/");
        return;
      }
      const authData = await authRes.json();
      if (authData.user?.role !== "founder" && authData.user?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setCurrentUser(authData.user);

      // 1. Load Groups
      const grpRes = await fetch("/api/groups");
      const grpData = await grpRes.json();
      const groupsList = grpData.groups || (grpData.group ? [grpData.group] : []);
      setAllGroups(groupsList);

      if (groupsList.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groupsList[0]._id);
      }

      // 2. Load Join Applications
      const appRes = await fetch("/api/admin/join-requests");
      if (appRes.ok) {
        const appData = await appRes.json();
        setApplications(appData.applications || []);
      }

      // 3. Load Loan Requests
      const reqRes = await fetch("/api/withdrawal");
      const reqData = await reqRes.json();
      setRequests(reqData.requests || []);

      // 4. Load Clients Initial List
      loadClients("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selectedGroupId changes, load that group's specific members & deposit records
  useEffect(() => {
    if (!selectedGroupId) return;
    const fetchGroupData = async () => {
      try {
        const res = await fetch(`/api/groups?groupId=${selectedGroupId}`);
        if (res.ok) {
          const data = await res.json();
          setGroupMembers(data.members || []);
          setGroupTotalCollected(data.total_collected_lifetime || 0);
          setGroupPoolBalance(data.available_pool_balance || 0);
        }
      } catch (err) {
        console.error("Error loading group members:", err);
      }
    };
    fetchGroupData();
  }, [selectedGroupId]);

  // Load clients for Tab 4
  const loadClients = async (query: string = "") => {
    setSearchingClients(true);
    try {
      const res = await fetch(`/api/admin/clients?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setClientsList(data.clients || []);
      }
    } catch (err) {
      console.error("Load clients error:", err);
    } finally {
      setSearchingClients(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  // 1. Create New Fund Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingGroup(true);
    setCreateGroupMsg("");

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: gName,
          monthly_amount: Number(gAmount),
          due_date_day: Number(gDueDate),
          start_date: gStartDate || undefined,
          end_date: gEndDate || undefined,
          total_cycle_months: Number(gCycleMonths),
          max_members: Number(gMaxMembers),
          description: gDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateGroupMsg("❌ " + data.error);
        setCreatingGroup(false);
        return;
      }

      setCreateGroupMsg("✅ " + data.message);
      setGName("");
      setGAmount("10");
      setGDueDate("5");
      setGStartDate("");
      setGEndDate("");
      setGCycleMonths("12");
      setGMaxMembers("12");
      setGDesc("");
      loadData();
    } catch {
      setCreateGroupMsg("❌ ग्रुप बनाने में त्रुटि हुई।");
    } finally {
      setCreatingGroup(false);
    }
  };

  // 2. Approve or Reject Client Join Request
  const handleApproveApplication = async (membershipId: string, action: "approve" | "reject") => {
    setHandlingAppId(membershipId);
    try {
      const res = await fetch("/api/admin/join-requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membership_id: membershipId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("❌ " + data.error);
      } else {
        alert("✅ " + data.message);
        loadData();
      }
    } catch {
      alert("कार्रवाई दर्ज करने में त्रुटि हुई।");
    } finally {
      setHandlingAppId(null);
    }
  };

  // 3. Update Client Details
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setUpdatingClient(true);
    setClientActionMsg("");

    try {
      const res = await fetch("/api/admin/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingClient._id,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setClientActionMsg("❌ " + data.error);
      } else {
        setClientActionMsg("✅ " + data.message);
        setEditingClient(null);
        loadClients(searchMobile);
      }
    } catch {
      setClientActionMsg("❌ क्लाइंट अपडेट करने में त्रुटि हुई।");
    } finally {
      setUpdatingClient(false);
    }
  };

  // 4. Delete Client
  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`क्या आप वाकई क्लाइंट '${clientName}' को सिस्टम से हमेशा के लिए डिलीट करना चाहते हैं?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/clients?userId=${clientId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert("❌ " + data.error);
      } else {
        alert("✅ " + data.message);
        loadClients(searchMobile);
      }
    } catch {
      alert("डिलीट करने में त्रुटि हुई।");
    }
  };

  // 5. Disburse Loan & Broadcast Screenshot Email
  const handleDisburseLoan = async (e: React.FormEvent) => {
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
      alert("लोन भुगतान दर्ज करने में त्रुटि हुई।");
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

  const pendingApprovalsCount = applications.filter((a) => a.status === "pending").length;
  const pendingLoansCount = requests.filter((r) => r.status !== "disbursed" && r.status !== "rejected").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-amber-300 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>👑 मुख्य एडमिन कंट्रोल पैनल (Admin Only)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">नमस्ते, {currentUser?.name}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
            ईमेल: {currentUser?.email} • कुल फंड ग्रुप्स: {allGroups.length} • केवल एडमिन और क्लाइंट प्रणाली
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition"
          >
            होमपेज देखें
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600/80 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (5 Clean Tabs as requested) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("groups")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "groups"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>1. ग्रुप बनाएं व सूची ({allGroups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("approvals")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "approvals"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>2. क्लाइंट अप्रूवल</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
              {pendingApprovalsCount} नए
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("collections")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "collections"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>3. ग्रुप सदस्य व जमा स्थिति</span>
        </button>

        <button
          onClick={() => setActiveTab("clients")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "clients"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. क्लाइंट सर्च व एडिट/डिलीट</span>
        </button>

        <button
          onClick={() => setActiveTab("loans")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "loans"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>5. लोन अप्रूवल व डिस्बर्सल ({requests.length})</span>
          {pendingLoansCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
              {pendingLoansCount} पेंडिंग
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: CREATE GROUP & ALL GROUPS LIST                          */}
      {/* ============================================================== */}
      {activeTab === "groups" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Group Form */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 mb-1">
                👑 एडमिन अधिकार
              </div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-600" />
                <span>नया फंड ग्रुप खोलें (Create Group)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                मासिक अंशदान (जैसे 10, 20, 100, 5000) एवं कब से कब तक की तिथि एडमिन तय करेगा।
              </p>
            </div>

            {createGroupMsg && (
              <div className="p-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-800">
                {createGroupMsg}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ग्रुप का नाम (Fund Group Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. BBCC 20-Rupee Daily Pool"
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मासिक अंशदान (₹ / माह)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="उदा. 10 या 20"
                    value={gAmount}
                    onChange={(e) => setGAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">₹10, ₹20 या कोई भी राशि</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    देय तारीख (Due Day)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={28}
                    placeholder="1 से 28 तारीख"
                    value={gDueDate}
                    onChange={(e) => setGDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Date Range: Kab se kab tak */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    प्रारंभ तिथि (कब से)
                  </label>
                  <input
                    type="date"
                    value={gStartDate}
                    onChange={(e) => setGStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    समाप्ति तिथि (कब तक)
                  </label>
                  <input
                    type="date"
                    value={gEndDate}
                    onChange={(e) => setGEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    अवधि (चक्र के कुल माह)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="उदा. 12"
                    value={gCycleMonths}
                    onChange={(e) => setGCycleMonths(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    अधिकतम सदस्य संख्या
                  </label>
                  <input
                    type="number"
                    required
                    min={2}
                    placeholder="उदा. 12 या 20"
                    value={gMaxMembers}
                    onChange={(e) => setGMaxMembers(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ग्रुप विवरण / नियम
                </label>
                <textarea
                  rows={2}
                  placeholder="उदा. 10 रुपए का दैनिक / मासिक बचत पूल।"
                  value={gDesc}
                  onChange={(e) => setGDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={creatingGroup}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                {creatingGroup ? "ग्रुप बनाया जा रहा है..." : "नया फंड ग्रुप बनाएं (Create Group)"}
              </button>
            </form>
          </div>

          {/* List of All Groups */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                सक्रिय फंड ग्रुप्स ({allGroups.length})
              </h3>
              <span className="text-xs text-slate-500 font-medium">होमपेज पर सभी को दिखाई देंगे</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allGroups.map((g) => (
                <div
                  key={g._id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5 hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{g.name}</h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase">
                      {g.status || "active"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium line-clamp-2">
                    {g.description || "मासिक बचत व आपातकालीन फंड।"}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      मासिक: ₹{g.monthly_amount?.toLocaleString()}/माह
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      तारीख: हर माह {g.due_date_day} तारीख
                    </div>
                    {(g.start_date || g.end_date) && (
                      <div className="col-span-2 bg-white p-2 rounded-xl border border-slate-200 font-semibold text-slate-800">
                        अवधि: {g.start_date || "—"} से {g.end_date || "—"}
                      </div>
                    )}
                    <div className="bg-white p-2 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      साइकिल: {g.total_cycle_months} माह ({g.current_cycle_month}/{g.total_cycle_months})
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200 font-semibold text-slate-800">
                      सदस्य क्षमता: {g.max_members || 12} लोग
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: CLIENT APPROVALS & KYC INSPECTION                       */}
      {/* ============================================================== */}
      {activeTab === "approvals" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
                <CheckCircle className="w-4 h-4" />
                <span>क्लाइंट सत्यापन एवं अप्रूवल</span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                ग्रुप में जुड़ने के लंबित आवेदन ({applications.filter((a) => a.status === "pending").length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              डॉक्यूमेंट व लाइव फोटो देखने के बाद ही स्वीकार करें।
            </span>
          </div>

          {applications.filter((a) => a.status === "pending").length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500">
              ✅ वर्तमान में कोई नया आवेदन लंबित नहीं है। सभी आवेदन स्वीकृत हैं।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">आवेदक का नाम / ईमेल</th>
                    <th className="py-3 px-4">मोबाइल / PAN</th>
                    <th className="py-3 px-4">ग्रुप का नाम</th>
                    <th className="py-3 px-4">मासिक अंशदान</th>
                    <th className="py-3 px-4 text-center">लोन-ग्रेड KYC</th>
                    <th className="py-3 px-4 text-center">कार्रवाई (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications
                    .filter((a) => a.status === "pending")
                    .map((app) => (
                      <tr key={app._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{app.user_name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{app.user_email}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{app.user_mobile}</div>
                          <div className="text-[11px] font-mono text-slate-500 uppercase">{app.user_pan}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-brand-700">{app.group_name}</td>
                        <td className="py-3 px-4 font-black text-slate-900">₹{app.monthly_amount}/माह</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setInspectingApp(app)}
                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600" />
                            <span>दस्तावेज व फोटो देखें 🔍</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApproveApplication(app._id, "approve")}
                              disabled={handlingAppId === app._id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                            >
                              {handlingAppId === app._id ? "..." : "स्वीकार करें ✅"}
                            </button>
                            <button
                              onClick={() => handleApproveApplication(app._id, "reject")}
                              disabled={handlingAppId === app._id}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                            >
                              अस्वीकार ❌
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: GROUP COLLECTIONS & MEMBER DEPOSIT RECORDS              */}
      {/* ============================================================== */}
      {activeTab === "collections" && (
        <div className="space-y-6">
          {/* Group Selector Dropdown */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-brand-600 tracking-wider">
                ग्रुप अनुसार पारदर्शी खाता
              </span>
              <h3 className="text-lg font-black text-slate-900">
                ग्रुप चुनें और सभी सदस्यों की जमा स्थिति देखें
              </h3>
            </div>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
            >
              {allGroups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name} (₹{g.monthly_amount}/माह)
                </option>
              ))}
            </select>
          </div>

          {/* KPI Summary for this group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                कुल जुड़े क्लाइंट (Members)
              </span>
              <p className="mt-2 text-2xl font-black text-slate-900">{groupMembers.length} लोग</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                कुल जमा राशि (Total Collected)
              </span>
              <p className="mt-2 text-2xl font-black text-emerald-600">
                ₹{groupTotalCollected.toLocaleString()}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                उपलब्ध फंड बैलेंस (Available Pool)
              </span>
              <p className="mt-2 text-2xl font-black text-brand-600">
                ₹{groupPoolBalance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Members Deposit Records Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                इस ग्रुप के क्लाइंट एवं उनकी जमा तारीख (Deposit Status)
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                जमा करने वाले: {groupMembers.filter((m) => m.payment_status === "paid").length} / {groupMembers.length}
              </span>
            </div>

            {groupMembers.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-slate-400">
                इस ग्रुप में अभी कोई सदस्य नहीं जुड़ा है।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">क्लाइंट का नाम</th>
                      <th className="py-3 px-4">मोबाइल नंबर</th>
                      <th className="py-3 px-4">मासिक अंशदान स्टेटस</th>
                      <th className="py-3 px-4">पैसा डालने की तारीख (Deposit Date)</th>
                      <th className="py-3 px-4">जमा राशि</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {groupMembers.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                        <td className="py-3 px-4 text-slate-600">{m.mobile}</td>
                        <td className="py-3 px-4">
                          {m.payment_status === "paid" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              जमा है ✅
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              बाकी है ⏳
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">
                          {m.paid_at ? new Date(m.paid_at).toLocaleDateString("hi-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }) : "—"}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">
                          {m.payment_status === "paid" ? `₹${m.paid_amount || 0}` : "—"}
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

      {/* ============================================================== */}
      {/* TAB 4: CLIENT SEARCH, EDIT & DELETE                            */}
      {/* ============================================================== */}
      {activeTab === "clients" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                क्लाइंट डेटा प्रबंधन
              </span>
              <h3 className="text-xl font-black text-slate-900">
                मोबाइल नंबर से क्लाइंट खोजें, एडिट करें या डिलीट करें
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                किसी भी क्लाइंट का मोबाइल नंबर दर्ज कर उनका पूरा विवरण देख सकते हैं और अपडेट कर सकते हैं।
              </p>
            </div>

            {/* Search Input Box */}
            <div className="flex items-center gap-2 w-full sm:w-80">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="मोबाइल नंबर दर्ज करें..."
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadClients(searchMobile);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <button
                onClick={() => loadClients(searchMobile)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                खोजें
              </button>
            </div>
          </div>

          {clientActionMsg && (
            <div className="p-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-800">
              {clientActionMsg}
            </div>
          )}

          {/* Clients Table */}
          {searchingClients ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400">
              क्लाइंट खोजे जा रहे हैं...
            </div>
          ) : clientsList.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400">
              कोई क्लाइंट नहीं मिला।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">नाम</th>
                    <th className="py-3 px-4">मोबाइल</th>
                    <th className="py-3 px-4">ईमेल</th>
                    <th className="py-3 px-4">जन्मतिथि</th>
                    <th className="py-3 px-4">पैन / आधार</th>
                    <th className="py-3 px-4 text-center">कार्रवाई (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {clientsList.map((client) => (
                    <tr key={client._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{client.name}</td>
                      <td className="py-3 px-4 text-slate-700 font-mono font-bold">{client.mobile}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{client.email}</td>
                      <td className="py-3 px-4 text-slate-600">{client.dob}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {client.pan} / XXXX-{client.aadhaar_last4}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingClient(client);
                              setEditForm({
                                name: client.name,
                                mobile: client.mobile,
                                dob: client.dob,
                                father_name: client.father_name || "",
                                address: client.address || "",
                                city: client.city || "",
                                pincode: client.pincode || "",
                                occupation: client.occupation || "",
                                monthly_income: client.monthly_income || "",
                                nominee_name: client.nominee_name || "",
                                nominee_relation: client.nominee_relation || "",
                                nominee_mobile: client.nominee_mobile || "",
                                bank_details: client.bank_details || {
                                  account_number: "",
                                  ifsc: "",
                                  upi_id: "",
                                },
                              });
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>एडिट</span>
                          </button>

                          <button
                            onClick={() => handleDeleteClient(client._id, client.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>डिलीट</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: LOAN APPROVALS, DISBURSAL & SCREENSHOT BROADCAST       */}
      {/* ============================================================== */}
      {activeTab === "loans" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Vote className="w-5 h-5 text-purple-600" />
                  <span>सक्रिय लोन रिक्वेस्ट, वोटिंग एवं डिस्बर्सल</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  वोटिंग के बाद एडमिन बैंक/UPI में पैसा भेजकर स्क्रीनशॉट अपलोड करेंगे जो सभी सदस्यों को स्वतः ईमेल होगा।
                </p>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium bg-slate-50 rounded-2xl">
                वर्तमान में कोई सक्रिय लोन रिक्वेस्ट नहीं है।
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((r) => (
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
                        ब्याज: ₹1 सैकड़ा प्रतिमाह (1%)
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                          {r.votes_count} वोट प्राप्त
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            r.status === "disbursed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          स्थिति: {r.status === "disbursed" ? "भुगतान पूर्ण ✅" : "प्रतीक्षारत ⏳"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                      {r.status !== "disbursed" ? (
                        <button
                          onClick={() => setSelectedReqForPayout(r)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>भुगतान करें व स्क्रीनशॉट डालें</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl">
                            भुगतान पूर्ण (Disbursed)
                          </span>
                          {r.payment_screenshot_url && (
                            <button
                              onClick={() =>
                                setEnlargedImage({
                                  url: r.payment_screenshot_url!,
                                  title: `${r.user_name} - पेमेंट स्क्रीनशॉट प्रमाण`,
                                })
                              }
                              className="px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-300 rounded-lg text-xs font-bold"
                            >
                              स्क्रीनशॉट देखें 🔍
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: LOAN-GRADE KYC INSPECTION MODAL                      */}
      {/* ============================================================== */}
      {inspectingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
                  🔍 लोन-ग्रेड KYC सत्यापन फाइल
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {inspectingApp.user_name} का पूर्ण KYC दस्तावेज
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  ईमेल: {inspectingApp.user_email} • मोबाइल: {inspectingApp.user_mobile} • ग्रुप: {inspectingApp.group_name}
                </p>
              </div>
              <button
                onClick={() => setInspectingApp(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Selfie Photo & Basic Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase mb-2">लाइव कैमरा फोटो</span>
                {inspectingApp.photo_live ? (
                  <img
                    src={inspectingApp.photo_live}
                    alt="Live Photo"
                    className="w-28 h-28 object-cover rounded-2xl border-2 border-indigo-500 shadow-md cursor-pointer hover:opacity-90 transition"
                    onClick={() =>
                      setEnlargedImage({
                        url: inspectingApp.photo_live!,
                        title: `${inspectingApp.user_name} - लाइव सेल्फी फोटो`,
                      })
                    }
                  />
                ) : (
                  <div className="w-28 h-28 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">
                    फोटो उपलब्ध नहीं
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-1 font-medium">बड़ा देखने के लिए क्लिक करें</span>
              </div>

              <div className="sm:col-span-2 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 font-semibold block">पिता / पति का नाम:</span>
                    <span className="font-bold text-slate-900">{inspectingApp.father_name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">जन्मतिथि (DOB):</span>
                    <span className="font-bold text-slate-900">{inspectingApp.user_dob || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">लिंग / वैवाहिक स्थिति:</span>
                    <span className="font-bold text-slate-900">
                      {inspectingApp.gender || "—"} / {inspectingApp.marital_status || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">व्यवसाय व मासिक आय:</span>
                    <span className="font-bold text-slate-900">
                      {inspectingApp.occupation || "—"} (₹{inspectingApp.monthly_income || "—"})
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 font-semibold block">स्थाई पता (Full Address):</span>
                  <span className="font-bold text-slate-900">
                    {inspectingApp.address || "—"}, {inspectingApp.city || "—"} - {inspectingApp.pincode || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Nominee & Bank Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-black text-slate-900 uppercase text-[11px] text-amber-700">
                  वारिस (Nominee) विवरण
                </h4>
                <div>
                  <span className="text-slate-500 font-semibold block">नॉमिनी का नाम:</span>
                  <span className="font-bold text-slate-900">{inspectingApp.nominee_name || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 font-semibold block">संबंध:</span>
                    <span className="font-bold text-slate-900">{inspectingApp.nominee_relation || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">नॉमिनी मोबाइल:</span>
                    <span className="font-bold text-slate-900">{inspectingApp.nominee_mobile || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-black text-slate-900 uppercase text-[11px] text-emerald-700">
                  बैंक एवं भुगतान विवरण (Payout Account)
                </h4>
                <div>
                  <span className="text-slate-500 font-semibold block">बैंक खाता संख्या:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {inspectingApp.bank_details?.account_number || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 font-semibold block">IFSC कोड:</span>
                    <span className="font-bold text-slate-900 font-mono uppercase">
                      {inspectingApp.bank_details?.ifsc || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">UPI ID:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {inspectingApp.bank_details?.upi_id || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* KYC Document Images */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-brand-600" />
                <span>अपलोड किए गए पहचान दस्तावेज</span>
              </h4>

              {/* Aadhaar Section */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  आधार कार्ड (XXXX-XXXX-{inspectingApp.user_aadhaar_last4})
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <span className="text-[11px] text-slate-500 font-semibold block mb-1">सामने का भाग (Front)</span>
                    {inspectingApp.aadhaar_front ? (
                      <img
                        src={inspectingApp.aadhaar_front}
                        alt="Aadhaar Front"
                        className="w-full h-36 object-contain bg-white rounded-xl border border-slate-300 p-1 cursor-pointer hover:opacity-90 transition"
                        onClick={() =>
                          setEnlargedImage({
                            url: inspectingApp.aadhaar_front!,
                            title: `${inspectingApp.user_name} - आधार कार्ड (Front)`,
                          })
                        }
                      />
                    ) : (
                      <div className="w-full h-36 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                        फोटो उपलब्ध नहीं
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <span className="text-[11px] text-slate-500 font-semibold block mb-1">पीछे का भाग (Back)</span>
                    {inspectingApp.aadhaar_back ? (
                      <img
                        src={inspectingApp.aadhaar_back}
                        alt="Aadhaar Back"
                        className="w-full h-36 object-contain bg-white rounded-xl border border-slate-300 p-1 cursor-pointer hover:opacity-90 transition"
                        onClick={() =>
                          setEnlargedImage({
                            url: inspectingApp.aadhaar_back!,
                            title: `${inspectingApp.user_name} - आधार कार्ड (Back)`,
                          })
                        }
                      />
                    ) : (
                      <div className="w-full h-36 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                        फोटो उपलब्ध नहीं
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PAN Section */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      पैन कार्ड: <strong className="font-mono text-indigo-700 uppercase">{inspectingApp.user_pan}</strong>
                    </span>
                    <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-black uppercase">
                      {inspectingApp.pan_type === "epan" ? "e-PAN (डिजिटल)" : "Physical PAN"}
                    </span>
                  </div>

                  {inspectingApp.pan_type === "epan" && (
                    <div className="p-2 bg-amber-100 border border-amber-300 rounded-xl text-xs flex items-center gap-2">
                      <span className="font-bold text-amber-900">🔑 e-PAN पासवर्ड:</span>
                      <span className="font-mono bg-white text-slate-900 px-2 py-0.5 rounded font-black border border-amber-300 select-all">
                        {inspectingApp.epan_password || "उपलब्ध नहीं"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  {inspectingApp.pan_document ? (
                    <img
                      src={inspectingApp.pan_document}
                      alt="PAN Document"
                      className="max-h-48 mx-auto object-contain bg-white rounded-xl border border-slate-300 p-1 cursor-pointer hover:opacity-90 transition"
                      onClick={() =>
                        setEnlargedImage({
                          url: inspectingApp.pan_document!,
                          title: `${inspectingApp.user_name} - पैन कार्ड दस्तावेज`,
                        })
                      }
                    />
                  ) : (
                    <div className="w-full h-24 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                      दस्तावेज उपलब्ध नहीं
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setInspectingApp(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
              >
                बंद करें
              </button>
              <button
                onClick={() => {
                  const id = inspectingApp._id;
                  setInspectingApp(null);
                  handleApproveApplication(id, "reject");
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs hover:bg-rose-100 transition"
              >
                अस्वीकार ❌
              </button>
              <button
                onClick={() => {
                  const id = inspectingApp._id;
                  setInspectingApp(null);
                  handleApproveApplication(id, "approve");
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md transition"
              >
                स्वीकार करें व ग्रुप में जोड़ें ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT CLIENT DETAILS MODAL                             */}
      {/* ============================================================== */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-brand-600 tracking-wider">
                  क्लाइंट विवरण संपादन
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {editingClient.name} ({editingClient.mobile}) का डेटा अपडेट करें
                </h3>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">पूरा नाम</label>
                  <input
                    type="text"
                    required
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">मोबाइल नंबर</label>
                  <input
                    type="tel"
                    required
                    value={editForm.mobile || ""}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">पिता का नाम</label>
                  <input
                    type="text"
                    value={editForm.father_name || ""}
                    onChange={(e) => setEditForm({ ...editForm, father_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">जन्मतिथि</label>
                  <input
                    type="text"
                    value={editForm.dob || ""}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">पता</label>
                <input
                  type="text"
                  value={editForm.address || ""}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">शहर</label>
                  <input
                    type="text"
                    value={editForm.city || ""}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">पिनकोड</label>
                  <input
                    type="text"
                    value={editForm.pincode || ""}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बैंक खाता संख्या</label>
                  <input
                    type="text"
                    value={editForm.bank_details?.account_number || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        bank_details: { ...editForm.bank_details, account_number: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC कोड</label>
                  <input
                    type="text"
                    value={editForm.bank_details?.ifsc || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        bank_details: { ...editForm.bank_details, ifsc: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={editForm.bank_details?.upi_id || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        bank_details: { ...editForm.bank_details, upi_id: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={updatingClient}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  {updatingClient ? "अपडेट हो रहा है..." : "डेटा सेव करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: LOAN DISBURSAL & SCREENSHOT BROADCAST MODAL           */}
      {/* ============================================================== */}
      {selectedReqForPayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border-2 border-brand-500 p-6 sm:p-8 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-black uppercase text-brand-600 tracking-wider">
                  एडमिन लोन डिस्बर्सल व ईमेल प्रमाण
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {selectedReqForPayout.user_name} को लोन राशि भेजें
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  मांग: ₹{selectedReqForPayout.requested_amount.toLocaleString()} • ₹20 काटकर भेजें:{" "}
                  <strong className="text-emerald-700 text-sm font-black">
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

            <form onSubmit={handleDisburseLoan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  बैंक / UPI ट्रांजैक्शन UTR नंबर (Transaction ID)
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
                  पेमेंट स्क्रीनशॉट प्रमाण URL (Screenshot Link / Image)
                </label>
                <input
                  type="text"
                  required
                  placeholder="स्क्रीनशॉट का URL या लिंक"
                  value={payoutScreenshot}
                  onChange={(e) => setPayoutScreenshot(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  📢 "Done" करते ही यह स्क्रीनशॉट व UTR प्रमाण ग्रुप के <strong>सभी सदस्यों को तत्काल ईमेल</strong> द्वारा भेज दिया जाएगा।
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-xs font-bold text-amber-900 border border-amber-200">
                ⚠️ भुगतान दर्ज होते ही सदस्य से ₹1 सैकड़ा प्रतिमाह (1%) साधारण ब्याज की गणना शुरू हो जाएगी।
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReqForPayout(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={disbursing}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  {disbursing ? "दर्ज व ईमेल भेजा जा रहा है..." : "Done (भुगतान पूर्ण करें व ईमेल भेजें)"}
                </button>
              </div>
            </form>
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
