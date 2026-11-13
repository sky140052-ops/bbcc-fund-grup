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
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      title: "आधार व पैन सुरक्षित ऑनबोर्डिंग",
      desc: "एडमिन व मैनेजर द्वारा सदस्यों का पूरा KYC (मोबाइल, पैन, आधार, बैंक खाता) सुरक्षित रूप से दर्ज किया जाता है।",
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
          एक ऐसा आधुनिक और निष्पक्ष समूह जहाँ सभी सदस्य मिलकर बचत करते हैं, आवश्यकता पड़ने पर वोटिंग
          से फंड प्राप्त करते हैं और फाउंडर व MD के अप्रूवल से तुरंत सहयोग पाते हैं।
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 text-sm flex items-center gap-2 transition"
          >
            <span>पोर्टल पर लॉगिन करें</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/rules"
            className="px-6 py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-2xl font-bold text-sm flex items-center gap-2 transition"
          >
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>नियम व शर्तें पढ़ें (Rules)</span>
          </Link>
        </div>
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

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 transition"
            >
              <span>सुरक्षित पोर्टल पर लॉगिन करें</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
