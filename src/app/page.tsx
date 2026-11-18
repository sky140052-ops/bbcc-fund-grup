"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  CreditCard,
  Percent,
  Receipt,
  Vote,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen,
  Users,
  Calendar,
  Building,
  UserPlus,
  Clock,
  Sparkles,
  Mail,
  Phone,
  HelpCircle,
  FileText,
  Camera,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface FundGroupItem {
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
  user_status?: "approved" | "pending" | "rejected" | "none";
  available_pool?: number;
  status?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [groups, setGroups] = useState<FundGroupItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [helpContact, setHelpContact] = useState<{ email: string; phone: string }>({
    email: "contact@bbccfund.org",
    phone: "+91 99999 99999",
  });
  const [loading, setLoading] = useState(true);

  // Unified Join / Login Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [preselectedGroupId, setPreselectedGroupId] = useState<string>("");

  // OTP Login & Registration states
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [backupOtp, setBackupOtp] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Registration Form Fields (Loan-Grade KYC)
  const [regName, setRegName] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regFatherName, setRegFatherName] = useState("");
  const [regGender, setRegGender] = useState("पुरुष");
  const [regMaritalStatus, setRegMaritalStatus] = useState("विवाहित");
  const [regAddress, setRegAddress] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regPincode, setRegPincode] = useState("");
  const [regOccupation, setRegOccupation] = useState("");
  const [regMonthlyIncome, setRegMonthlyIncome] = useState("");
  const [regNomineeName, setRegNomineeName] = useState("");
  const [regNomineeRelation, setRegNomineeRelation] = useState("पत्नी");
  const [regNomineeMobile, setRegNomineeMobile] = useState("");
  const [regAadhaar, setRegAadhaar] = useState("");
  const [regPan, setRegPan] = useState("");
  const [regPanType, setRegPanType] = useState<"physical" | "epan">("physical");
  const [regEpanPassword, setRegEpanPassword] = useState("");
  const [regAccountNo, setRegAccountNo] = useState("");
  const [regIfsc, setRegIfsc] = useState("");
  const [regUpi, setRegUpi] = useState("");

  // Document Uploads (Base64)
  const [regPhotoLive, setRegPhotoLive] = useState("");
  const [regAadhaarFront, setRegAadhaarFront] = useState("");
  const [regAadhaarBack, setRegAadhaarBack] = useState("");
  const [regPanDocument, setRegPanDocument] = useState("");

  const loadData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (authRes.ok) {
        const authData = await authRes.json();
        setCurrentUser(authData.user);
      }

      const grpRes = await fetch("/api/groups");
      if (grpRes.ok) {
        const grpData = await grpRes.json();
        setGroups(grpData.groups || (grpData.group ? [grpData.group] : []));
        if (grpData.help_contact) {
          setHelpContact(grpData.help_contact);
        }
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

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("कृपया 4MB से कम आकार की फ़ाइल चुनें।");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "OTP भेजने में समस्या आई।");
        setAuthLoading(false);
        return;
      }

      setOtpSent(true);
      setIsRegistered(Boolean(data.is_registered));
      if (data.backup_otp) {
        setBackupOtp(data.backup_otp);
      }
      setAuthSuccess(data.message);
    } catch {
      setAuthError("सर्वर से जुड़ने में समस्या हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 2A: Verify OTP for Registered Member / Admin
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otpCode,
          remember_me: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "अमान्य OTP! कृपया पुनः प्रयास करें।");
        setAuthLoading(false);
        return;
      }

      // If user came via "Join Group" on a specific card
      if (preselectedGroupId) {
        await fetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group_id: preselectedGroupId }),
        });
      }

      setShowJoinModal(false);
      router.push(data.redirectTo || "/dashboard");
    } catch {
      setAuthError("सत्यापन में त्रुटि हुई।");
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 2B: Register New Client with KYC + OTP
  const handleRegisterAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!otpCode || otpCode.length !== 6) {
      setAuthError("कृपया 6-अंकीय OTP दर्ज करें जो आपके ईमेल पर भेजा गया है।");
      return;
    }

    if (regPanType === "epan" && !regEpanPassword.trim()) {
      setAuthError("e-PAN चुनने पर कृपया ई-पैन पीडीएफ का पासवर्ड दर्ज करें।");
      return;
    }

    setAuthLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email,
          mobile: regMobile,
          dob: regDob,
          father_name: regFatherName,
          gender: regGender,
          marital_status: regMaritalStatus,
          address: regAddress,
          city: regCity,
          pincode: regPincode,
          occupation: regOccupation,
          monthly_income: regMonthlyIncome,
          nominee_name: regNomineeName,
          nominee_relation: regNomineeRelation,
          nominee_mobile: regNomineeMobile,
          aadhaar: regAadhaar,
          pan: regPan,
          pan_type: regPanType,
          epan_password: regEpanPassword,
          photo_live: regPhotoLive,
          aadhaar_front: regAadhaarFront,
          aadhaar_back: regAadhaarBack,
          pan_document: regPanDocument,
          bank_details: {
            account_number: regAccountNo,
            ifsc: regIfsc,
            upi_id: regUpi,
          },
          group_id: preselectedGroupId || undefined,
          otp: otpCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "पंजीकरण में त्रुटि हुई।");
        setAuthLoading(false);
        return;
      }

      alert("✅ " + data.message);
      setShowJoinModal(false);
      router.push(data.redirectTo || "/dashboard");
    } catch {
      setAuthError("सर्वर से जुड़ने में समस्या हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setAuthLoading(false);
    }
  };

  const openJoinModal = (groupId?: string) => {
    if (groupId) setPreselectedGroupId(groupId);
    setEmail("");
    setOtpCode("");
    setOtpSent(false);
    setBackupOtp(null);
    setAuthError("");
    setAuthSuccess("");
    setShowJoinModal(true);
  };

  const termsList = [
    {
      title: "1. मासिक अंशदान (Monthly Instalment)",
      desc: "हर सदस्य को महीने की तय तारीख तक अपनी तय की गई मासिक राशि रेज़रपे गेटवे से जमा करना अनिवार्य है। जमा होते ही सभी सदस्यों को ईमेल अलर्ट जाएगा।",
    },
    {
      title: "2. अधिकतम लोन सीमा (Max Loan Limit)",
      desc: "कोई भी सदस्य केवल उतनी ही राशि का लोन मांग सकता है जितना उस समय ग्रुप के पूल फंड में कुल जमा है। अधिक की मांग स्वीकार नहीं होगी।",
    },
    {
      title: "3. सामुदायिक वोटिंग प्रणाली (Voting Priority)",
      desc: "जब कोई सदस्य लोन हेतु आवेदन करता है तो ग्रुप के सभी सदस्यों को ईमेल जाता है। सदस्य वोट देकर तय करते हैं कि किसको सबसे पहले लोन मिलना चाहिए।",
    },
    {
      title: "4. ₹20 कटौती एवं ₹1 सैकड़ा ब्याज दर (1% Interest)",
      desc: "स्वीकृत लोन राशि में से निर्धारित ₹20 काटकर शेष राशि सीधे बैंक/UPI में भेजी जाती है। भुगतान के दिन से केवल 1% प्रतिमाह साधारण ब्याज लगता है।",
    },
    {
      title: "5. 100% पारदर्शी पेमेंट स्क्रीनशॉट प्रमाण",
      desc: "एडमिन द्वारा सदस्य को पैसा भेजकर बैंक UTR व पेमेंट का स्क्रीनशॉट पोर्टल पर दर्ज किया जाता है, जो स्वतः सभी सदस्यों को ईमेल द्वारा भेजा जाता है।",
    },
    {
      title: "6. एक चक्र - एक मौका नियम",
      desc: "जिस सदस्य को एक बार लोन मिल जाता है, वह पूरा चक्र समाप्त होने तक दोबारा मांग नहीं कर सकता ताकि अन्य सभी सदस्यों को अवसर मिल सके।",
    },
  ];

  return (
    <div className="space-y-20 py-8 sm:py-14">
      {/* 1. HERO SECTION */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold tracking-wide">
          <Shield className="w-4 h-4 text-sky-600" />
          <span>100% पारदर्शी डिजिटल कम्युनिटी फंड • Astra DB एवं Razorpay सुरक्षित</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          BBCC GROUP FUND
          <span className="block mt-2 bg-gradient-to-r from-brand-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent text-3xl sm:text-5xl">
            पारदर्शी बचत एवं आपातकालीन सहायता समूह
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
          कोई भी व्यक्ति समूह से जुड़ने के लिए आवेदन कर सकता है। ग्रुप केवल एडमिन द्वारा बनाए जाते हैं और एडमिन के सत्यापन उपरांत आप सक्रिय सदस्य बनते हैं।
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {currentUser ? (
            <Link
              href={currentUser.role === "admin" || currentUser.role === "founder" ? "/admin" : "/dashboard"}
              className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 text-sm flex items-center gap-2 transition"
            >
              <span>डैशबोर्ड खोलें ({currentUser.name})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={() => openJoinModal()}
              className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 text-sm flex items-center gap-2 transition transform hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>समूह से जुड़ें / लॉगिन करें (Join / Login)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <a
            href="#terms"
            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-sm flex items-center gap-2 transition"
          >
            <BookOpen className="w-4 h-4 text-slate-600" />
            <span>नियम व शर्तें पढ़ें (Terms)</span>
          </a>

          <a
            href="#help"
            className="px-6 py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-2xl font-bold text-sm flex items-center gap-2 transition"
          >
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <span>सहायता केंद्र (Help & Contact)</span>
          </a>
        </div>
      </div>

      {/* 2. ACTIVE FUND GROUPS (Live from Database) */}
      <div id="groups" className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-600 mb-1">
              <Building className="w-4 h-4" />
              <span>उपलब्ध बचत फंड ग्रुप्स (Active Fund Pools)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              एडमिन द्वारा संचालित फंड ग्रुप्स
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              नीचे दिए गए किसी भी ग्रुप में जुड़ने के लिए आवेदन करें। एडमिन द्वारा अनुमोदन के बाद आपकी सदस्यता सक्रिय होगी।
            </p>
          </div>

          <span className="px-3.5 py-1.5 bg-slate-900 text-white rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
            कुल सक्रिय ग्रुप्स: {groups.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-slate-500 bg-white rounded-3xl border border-slate-200">
            ग्रुप्स लोड हो रहे हैं...
          </div>
        ) : groups.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Clock className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-700">वर्तमान में कोई ग्रुप उपलब्ध नहीं है</h3>
            <p className="text-xs text-slate-500">एडमिन जल्द ही नया फंड ग्रुप शुरू करेंगे।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((grp) => {
              const isJoined = grp.user_status === "approved";
              const isPending = grp.user_status === "pending";

              return (
                <div
                  key={grp._id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {grp.status === "active" ? "सक्रिय (Open)" : "पूर्ण (Closed)"}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 mt-2">{grp.name}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                        <Building className="w-5 h-5" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {grp.description || "मासिक बचत एवं पारस्परिक सहायता समूह।"}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">
                          मासिक अंशदान
                        </span>
                        <span className="text-base font-black text-slate-900">
                          ₹{grp.monthly_amount?.toLocaleString()}/माह
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">
                          देय तारीख
                        </span>
                        <span className="text-base font-black text-slate-900">
                          हर माह {grp.due_date_day} तारीख
                        </span>
                      </div>
                    </div>

                    {(grp.start_date || grp.end_date) && (
                      <div className="bg-slate-50 p-2.5 rounded-2xl text-[11px] font-medium text-slate-600">
                        📅 <strong>अवधि सीमा:</strong> {grp.start_date || "शुरुआत"} से {grp.end_date || "समाप्ति"} तक
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">
                          फंड अवधि (Cycle)
                        </span>
                        <span className="text-xs font-black text-slate-800">
                          {grp.total_cycle_months} महीने ({grp.current_cycle_month}/{grp.total_cycle_months})
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">
                          सदस्य क्षमता
                        </span>
                        <span className="text-xs font-black text-slate-800">
                          {grp.approved_members_count || 1} / {grp.max_members || 12} सदस्य
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    {isJoined ? (
                      <Link
                        href="/dashboard"
                        className="w-full py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>आप सदस्य हैं (डैशबोर्ड देखें)</span>
                      </Link>
                    ) : isPending ? (
                      <div className="w-full py-2.5 bg-amber-50 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>आवेदन लंबित है (Pending)</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => openJoinModal(grp._id)}
                        className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>इस ग्रुप में जुड़ें (Apply to Join)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. TERMS & CONDITIONS SECTION */}
      <div id="terms" className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
              <BookOpen className="w-4 h-4" />
              <span>TERM & CONDITIONS • नियम एवं शर्तें</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              BBCC Group Fund के आधिकारिक नियम
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              ग्रुप में जुड़ने से पूर्व सभी नियमों को ध्यानपूर्वक पढ़ें। सभी लेनदेन 100% पारदर्शी और स्वचालित हैं।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {termsList.map((t, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{t.title}</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {t.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 font-medium flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>नोट:</strong> किसी भी अनधिकृत गतिविधि या समय पर अंशदान न करने पर एडमिन को सदस्यता रद्द करने का पूर्ण अधिकार है।
            </p>
          </div>
        </div>
      </div>

      {/* 4. HELP & CONTACT SECTION */}
      <div id="help" className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                <HelpCircle className="w-4 h-4" />
                <span>सहायता एवं संपर्क केंद्र (HELP & SUPPORT)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">एडमिन सहायता डेस्क</h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                ग्रुप में जुड़ने, KYC सत्यापन, या भुगतान संबंधित किसी भी सहायता हेतु संपर्क करें:
              </p>
            </div>
            <button
              onClick={() => openJoinModal()}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md transition whitespace-nowrap"
            >
              अभी जुड़ें / लॉगिन करें
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase">
                <Mail className="w-4 h-4" />
                <span>आधिकारिक एडमिन ईमेल आईडी</span>
              </div>
              <p className="text-base font-black text-white font-mono break-all">
                {helpContact.email}
              </p>
              <a
                href={`mailto:${helpContact.email}?subject=BBCC Fund Help Request`}
                className="inline-block mt-1 text-xs text-sky-300 hover:underline font-semibold"
              >
                मदद के लिए ईमेल भेजें →
              </a>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                <Phone className="w-4 h-4" />
                <span>हेल्पलाइन / संपर्क मोबाइल</span>
              </div>
              <p className="text-base font-black text-white font-mono">
                {helpContact.phone}
              </p>
              <a
                href={`tel:${helpContact.phone.replace(/\s+/g, "")}`}
                className="inline-block mt-1 text-xs text-emerald-300 hover:underline font-semibold"
              >
                सीधे कॉल या व्हाट्सएप करें →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 5. UNIFIED JOIN / LOGIN MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`bg-white rounded-3xl w-full ${
              otpSent && !isRegistered ? "max-w-3xl" : "max-w-md"
            } max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 transition-all`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-brand-600 tracking-wider">
                  BBCC GROUP FUND • एकल प्रवेश द्वार
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {!otpSent
                    ? "समूह से जुड़ें / लॉगिन करें"
                    : isRegistered
                    ? "OTP सत्यापन एवं लॉगिन"
                    : "नया क्लाइंट पंजीकरण (KYC फॉर्म)"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {!otpSent
                    ? "एडमिन एवं क्लाइंट दोनों अपने ईमेल पर OTP मंगाकर प्रवेश कर सकते हैं।"
                    : isRegistered
                    ? `ईमेल ${email} पर 6-अंकीय OTP भेजा गया है।`
                    : "कृपया लोन-ग्रेड विवरण और पहचान दस्तावेज भरें।"}
                </p>
              </div>
              <button
                onClick={() => setShowJoinModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success Messages */}
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Backup OTP Screen Banner */}
            {backupOtp && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-between">
                <span>🔐 स्क्रीन बैकअप OTP: <strong>{backupOtp}</strong></span>
                <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-950 font-black">
                  परीक्षण हेतु
                </span>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    ईमेल पता (Gmail / Official Email)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="apna_email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    यदि आप पंजीकृत हैं तो सीधे लॉगिन होंगे। यदि नए हैं तो KYC फॉर्म खुलेगा।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>{authLoading ? "OTP भेजा जा रहा है..." : "6-अंकीय OTP मंगाएं"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : isRegistered ? (
              /* STEP 2A: Verify OTP for Registered Member or Admin */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    6-अंकीय OTP दर्ज करें
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="XXXXXX"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center tracking-widest text-xl font-black focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
                >
                  {authLoading ? "सत्यापित हो रहा है..." : "सत्यापित करें व लॉगिन करें"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode("");
                  }}
                  className="w-full text-center text-xs font-bold text-slate-500 hover:underline"
                >
                  ईमेल पता बदलें
                </button>
              </form>
            ) : (
              /* STEP 2B: Full Registration Form for New Client */
              <form onSubmit={handleRegisterAndJoin} className="space-y-6">
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs font-medium text-sky-900">
                  📋 आपका ईमेल नया है। कृपया नीचे दिए गए ऋण-ग्रेड KYC विवरण भरें और अपने ईमेल पर प्राप्त 6-अंकीय OTP दर्ज करें।
                </div>

                {/* Personal & Family Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    1. व्यक्तिगत व पारिवारिक विवरण
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">पूरा नाम</label>
                      <input
                        type="text"
                        required
                        placeholder="उदा. राहुल कुमार"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">मोबाइल नंबर</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-अंकीय मोबाइल"
                        value={regMobile}
                        onChange={(e) => setRegMobile(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">पिता / पति का नाम</label>
                      <input
                        type="text"
                        required
                        placeholder="पिता / पति का नाम"
                        value={regFatherName}
                        onChange={(e) => setRegFatherName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">जन्मतिथि (DOB)</label>
                      <input
                        type="text"
                        required
                        placeholder="DDMMYYYY (उदा. 15081995)"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">लिंग</label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      >
                        <option value="पुरुष">पुरुष (Male)</option>
                        <option value="महिला">महिला (Female)</option>
                        <option value="अन्य">अन्य</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">वैवाहिक स्थिति</label>
                      <select
                        value={regMaritalStatus}
                        onChange={(e) => setRegMaritalStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      >
                        <option value="विवाहित">विवाहित (Married)</option>
                        <option value="अविवाहित">अविवाहित (Single)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">स्थाई पता (Full Address)</label>
                    <input
                      type="text"
                      required
                      placeholder="मकान नंबर, गली, मोहल्ला / गांव"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">शहर / जिला</label>
                      <input
                        type="text"
                        required
                        placeholder="शहर"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">पिनकोड</label>
                      <input
                        type="text"
                        required
                        placeholder="6-अंकीय पिनकोड"
                        value={regPincode}
                        onChange={(e) => setRegPincode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Nominee & Bank Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    2. वारिस (Nominee) व बैंक खाता
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">नॉमिनी का नाम</label>
                      <input
                        type="text"
                        required
                        placeholder="नॉमिनी का नाम"
                        value={regNomineeName}
                        onChange={(e) => setRegNomineeName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">संबंध</label>
                      <input
                        type="text"
                        required
                        placeholder="उदा. पत्नी / पिता"
                        value={regNomineeRelation}
                        onChange={(e) => setRegNomineeRelation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">नॉमिनी मोबाइल</label>
                      <input
                        type="tel"
                        required
                        placeholder="मोबाइल नंबर"
                        value={regNomineeMobile}
                        onChange={(e) => setRegNomineeMobile(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">बैंक खाता संख्या</label>
                      <input
                        type="text"
                        required
                        placeholder="अकाउंट नंबर"
                        value={regAccountNo}
                        onChange={(e) => setRegAccountNo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">IFSC कोड</label>
                      <input
                        type="text"
                        required
                        placeholder="SBIN0001234"
                        value={regIfsc}
                        onChange={(e) => setRegIfsc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold uppercase focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (वैकल्पिक)</label>
                      <input
                        type="text"
                        placeholder="name@upi"
                        value={regUpi}
                        onChange={(e) => setRegUpi(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Identification & Documents */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    3. पहचान दस्तावेज एवं लाइव सेल्फी फोटो
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">आधार नंबर (12 अंक)</label>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        placeholder="12-अंकीय आधार नंबर"
                        value={regAadhaar}
                        onChange={(e) => setRegAadhaar(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">पैन कार्ड नंबर (10 अक्षर)</label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        value={regPan}
                        onChange={(e) => setRegPan(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold uppercase focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">पैन कार्ड का प्रकार</label>
                      <select
                        value={regPanType}
                        onChange={(e) => setRegPanType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                      >
                        <option value="physical">Physical PAN (फिजिकल कार्ड)</option>
                        <option value="epan">e-PAN (डिजिटल ई-पैन)</option>
                      </select>
                    </div>

                    {regPanType === "epan" && (
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          e-PAN PDF पासवर्ड (DOB DDMMYYYY)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="उदा. 15081995"
                          value={regEpanPassword}
                          onChange={(e) => setRegEpanPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* File Upload Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700 block">लाइव सेल्फी फोटो (Live Photo)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => handleFileUpload(e, setRegPhotoLive)}
                        className="text-[11px]"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700 block">आधार कार्ड (Front Image)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setRegAadhaarFront)}
                        className="text-[11px]"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700 block">आधार कार्ड (Back Image)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setRegAadhaarBack)}
                        className="text-[11px]"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700 block">पैन कार्ड फोटो / दस्तावेज</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, setRegPanDocument)}
                        className="text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Final Step: OTP Verification */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <label className="block text-xs font-black uppercase text-emerald-900 tracking-wider">
                    4. ईमेल पर प्राप्त 6-अंकीय OTP दर्ज करें ({email})
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="XXXXXX"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-center tracking-widest text-lg font-black focus:outline-none bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  {authLoading ? "पंजीकरण प्रोसेस हो रहा है..." : "पंजीकरण पूर्ण करें व समूह से जुड़ें (Join BBCC Fund)"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
