"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";

interface FundGroupItem {
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

export default function HomePage() {
  const [groups, setGroups] = useState<FundGroupItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [joinMsg, setJoinMsg] = useState<{ [key: string]: string }>({});

  const loadData = async () => {
    try {
      // Check auth
      const authRes = await fetch("/api/auth/me");
      if (authRes.ok) {
        const authData = await authRes.json();
        setCurrentUser(authData.user);
      }

      // Fetch groups
      const grpRes = await fetch("/api/groups");
      if (grpRes.ok) {
        const grpData = await grpRes.json();
        setGroups(grpData.groups || (grpData.group ? [grpData.group] : []));
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

  const handleApplyToJoin = async (groupId: string) => {
    if (!currentUser) {
      window.location.href = `/login?apply_group=${groupId}`;
      return;
    }

    setJoiningGroupId(groupId);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinMsg({ ...joinMsg, [groupId]: `❌ ${data.error}` });
      } else {
        setJoinMsg({ ...joinMsg, [groupId]: `✅ ${data.message}` });
        loadData();
      }
    } catch {
      setJoinMsg({ ...joinMsg, [groupId]: "❌ आवेदन भेजने में समस्या आई।" });
    } finally {
      setJoiningGroupId(null);
    }
  };

  const features = [
    {
      title: "आधार व पैन सुरक्षित ऑनबोर्डिंग",
      desc: "एडमिन व मैनेजिंग डायरेक्टर द्वारा सदस्यों का पूरा KYC (मोबाइल, पैन, आधार, बैंक खाता) सुरक्षित रूप से दर्ज किया जाता है।",
      icon: Users,
    },
    {
      title: "रेज़रपे (Razorpay) गेटवे पेमेंट",
      desc: "हर महीने की नियत तारीख पर सभी सदस्य UPI, कार्ड या नेटबैंकिंग से सुरक्षित रूप से मासिक अंशदान जमा करते हैं।",
      icon: CreditCard,
    },
    {
      title: "ज़रूरतमंद के लिए पारदर्शी वोटिंग",
      desc: "इमर्जेंसी में पैसे की आवश्यकता होने पर सदस्य आवेदन करते हैं और ग्रुप के सभी लोग मिलकर वोट करते हैं।",
      icon: Vote,
    },
    {
      title: "फाउंडर एवं MD का दोहरा अप्रूवल",
      desc: "वोटिंग में चयन के बाद फाउंडर और मैनेजिंग डायरेक्टर दोनों के डिजिटल अप्रूवल के बाद ही भुगतान स्वीकृत होता है।",
      icon: CheckCircle2,
    },
    {
      title: "₹1 सैकड़ा प्रतिमाह ब्याज दर",
      desc: "पैसे मिलने की तारीख से केवल 1% प्रतिमाह (₹1 प्रति ₹100/माह) साधारण ब्याज दर लागू होती है।",
      icon: Percent,
    },
    {
      title: "स्क्रीनशॉट प्रमाण व ₹20 कटौती",
      desc: "फाउंडर ₹20 काटकर सीधे बैंक में पैसा भेजकर पेमेंट का स्क्रीनशॉट पोर्टल पर अपलोड करता है, जो सबको दिखता है।",
      icon: Receipt,
    },
  ];

  return (
    <div className="space-y-16 py-10 sm:py-16">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold tracking-wide">
          <Shield className="w-4 h-4 text-sky-600" />
          <span>Astra DB एवं Razorpay द्वारा संचालित 100% पारदर्शी बचत समूह</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          BBCC FUND GRUP <br />
          <span className="bg-gradient-to-r from-brand-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
            डिजिटल कमेटी व सहयोग फंड
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
          कोई भी व्यक्ति इस बचत समूह से जुड़ने के लिए आवेदन कर सकता है। ग्रुप केवल एडमिन द्वारा बनाए
          जाते हैं एवं एडमिन के अप्रूवल के बाद ही सदस्य सक्रिय होते हैं।
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {currentUser ? (
            <Link
              href={currentUser.role === "member" ? "/dashboard" : "/admin"}
              className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 text-sm flex items-center gap-2 transition"
            >
              <span>डैशबोर्ड खोलें ({currentUser.name})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 text-sm flex items-center gap-2 transition"
              >
                <span>लॉगिन करें (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login?tab=register"
                className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span>नया खाता बनाएं (Register)</span>
              </Link>
            </>
          )}

          <Link
            href="/rules"
            className="px-6 py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-2xl font-bold text-sm flex items-center gap-2 transition"
          >
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>नियम व शर्तें पढ़ें (Rules)</span>
          </Link>
        </div>
      </div>

      {/* ACTIVE FUND GROUPS SECTION (Live from Database) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
              आप नीचे दिए गए किसी भी ग्रुप में जुड़ने के लिए आवेदन कर सकते हैं। एडमिन के अप्रूवल के बाद आपकी सदस्यता सक्रिय होगी।
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
              const msg = joinMsg[grp._id];
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

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    {msg && (
                      <div className="p-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800">
                        {msg}
                      </div>
                    )}

                    {isJoined ? (
                      <Link
                        href="/dashboard"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>आप सदस्य हैं (डैशबोर्ड देखें)</span>
                      </Link>
                    ) : isPending ? (
                      <div className="w-full py-2.5 bg-amber-50 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>आवेदन समीक्षाधीन है (Pending Approval)</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApplyToJoin(grp._id)}
                        disabled={joiningGroupId === grp._id}
                        className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>
                          {joiningGroupId === grp._id
                            ? "आवेदन भेजा जा रहा है..."
                            : currentUser
                            ? "इस ग्रुप से जुड़ें (Apply to Join)"
                            : "जुड़ने के लिए लॉगिन / रजिस्टर करें"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            ग्रुप की प्रमुख विशेषताएं एवं नियम
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            हर प्रक्रिया निष्पक्ष, स्वचालित एवं डेटाबेस में पारदर्शी रूप से दर्ज होती है।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Data Integrity Assurance */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4" />
            <span>सुरक्षा एवं डेटा अखंडता (High Security Guarantee)</span>
          </div>
          <h3 className="text-2xl font-black">100% एन्क्रिप्टेड एवं हैक-प्रूफ प्रणाली</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
            BBCC Fund Grup का डेटाबेस सीधे <strong>DataStax Astra DB (NoSQL Serverless Cloud)</strong> पर
            होस्टेड है। किसी भी सदस्य का आधार या पासवर्ड कभी भी प्लेन टेक्स्ट में स्टोर नहीं होता:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-xs font-bold text-sky-400 block mb-1">🔐 Bcrypt पासवर्ड हैशिंग</span>
              <p className="text-xs text-slate-300 font-medium">
                सभी पासवर्ड्स और क्रेडेंशियल्स 12-राउंड सॉल्टेड हैश के साथ पूर्ण सुरक्षित हैं।
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-xs font-bold text-amber-400 block mb-1">🛡️ आधार HMAC-SHA256</span>
              <p className="text-xs text-slate-300 font-medium">
                आधार नंबर केवल अंतिम 4 अंक दिखाता है; मूल आधार डेटाबेस में क्रिप्टोग्राफिक रूप से सील रहता है।
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-xs font-bold text-emerald-400 block mb-1">💳 रेज़रपे सुरक्षित गेटवे</span>
              <p className="text-xs text-slate-300 font-medium">
                सभी भुगतान PCI-DSS प्रमाणित बैंक-स्तरीय रेज़रपे गेटवे द्वारा सत्यापित होते हैं।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
