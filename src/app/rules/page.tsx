import Link from "next/link";
import {
  ShieldAlert,
  Calendar,
  Percent,
  Receipt,
  Vote,
  CheckCircle2,
  Lock,
  ArrowLeft,
  FileText,
} from "lucide-react";

export default function RulesPage() {
  const rules = [
    {
      id: 1,
      title: "1. मासिक अंशदान (Monthly Instalment)",
      desc: "ग्रुप के सभी सदस्यों को हर महीने की निर्धारित तारीख (Due Date) तक अपनी तय की गई मासिक राशि रेज़रपे (Razorpay) गेटवे के माध्यम से जमा करना अनिवार्य है।",
      icon: Calendar,
      color: "blue",
    },
    {
      id: 2,
      title: "2. फंड निकासी की अधिकतम सीमा (Max Fund Limit)",
      desc: "ज़रूरत पड़ने पर कोई भी सदस्य केवल उतनी ही राशि की मांग (Request) कर सकता है जितना उस समय तक ग्रुप के कुल फंड पूल में जमा हो चुका है। जमा राशि से एक रुपया भी अधिक की रिक्वेस्ट नहीं स्वीकार की जाएगी।",
      icon: Lock,
      color: "indigo",
    },
    {
      id: 3,
      title: "3. पैसा लौटाने की पक्की तारीख (Repayment Commitment)",
      desc: "निकासी रिक्वेस्ट डालते समय सदस्य को यह स्पष्ट भरना होगा कि वह कितने दिनों में अथवा किस तारीख को लिया गया पैसा वापस ग्रुप के खाते में लौटाएगा।",
      icon: FileText,
      color: "emerald",
    },
    {
      id: 4,
      title: "4. ब्याज दर: ₹1 सैकड़ा प्रतिमाह (1% Monthly Interest)",
      desc: "जिस तारीख को फाउंडर द्वारा सदस्य के खाते में पैसा भेजा जाएगा, उसी दिन से प्रति माह 1% (यानी ₹1 प्रति ₹100 प्रतिमाह) साधारण ब्याज लगना शुरू हो जाएगा, जब तक कि मूलधन वापस जमा न हो।",
      icon: Percent,
      color: "amber",
    },
    {
      id: 5,
      title: "5. निर्धारित ₹20 कटौती (Fixed Platform Fee)",
      desc: "सदस्य द्वारा जितनी भी राशि की रिक्वेस्ट डाली जाएगी, फाउंडर द्वारा उसमें से फिक्स ₹20 काटकर बाकी बची राशि ट्रांसफर की जाएगी। (उदाहरण: ₹10,000 की रिक्वेस्ट पर सदस्य को ₹9,980 प्राप्त होंगे)।",
      icon: Receipt,
      color: "rose",
    },
    {
      id: 6,
      title: "6. पारदर्शी वोटिंग प्रणाली (Community Voting)",
      desc: "यदि एक से अधिक सदस्य एक ही महीने में फंड की मांग करते हैं, तो ग्रुप के सभी सदस्यों को वोटिंग का अधिकार होगा। जिस सदस्य को सबसे अधिक वोट मिलेंगे, उसे प्राथमिकता दी जाएगी।",
      icon: Vote,
      color: "purple",
    },
    {
      id: 7,
      title: "7. फाउंडर एवं मैनेजिंग डायरेक्टर (MD) डुअल अप्रूवल",
      desc: "वोटिंग में चयन होने के उपरांत फाउंडर (मुख्य एडमिन) और मैनेजिंग डायरेक्टर दोनों के डिजिटल अप्रूवल के बाद ही भुगतान स्वीकृत होगा।",
      icon: CheckCircle2,
      color: "teal",
    },
    {
      id: 8,
      title: "8. फाउंडर पेमेंट व स्क्रीनशॉट प्रमाण (Payment Screenshot Proof)",
      desc: "फाउंडर द्वारा सीधे बैंक/UPI से सदस्य को पैसा भेजा जाएगा और पेमेंट का स्क्रीनशॉट व UTR नंबर पोर्टल पर अपलोड किया जाएगा, जो ग्रुप के सभी सदस्यों को पारदर्शी रूप से दिखेगा।",
      icon: ShieldAlert,
      color: "sky",
    },
    {
      id: 9,
      title: "9. एक चक्र - एक मौका नियम (Cycle Rotation Policy)",
      desc: "एक बार जिस सदस्य को पूरे पूल का फंड मिल जाएगा, वह सदस्य वर्तमान चक्र समाप्त होने तक दोबारा नई रिक्वेस्ट नहीं डाल सकता ताकि बाकी सभी सदस्यों को बारी-बारी से सहयोग मिल सके।",
      icon: Lock,
      color: "slate",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>होमपेज पर वापस जाएं</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-4 backdrop-blur">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            BBCC FUND GRUP (बीबीसीसी फंड ग्रुप)
          </h1>
          <p className="mt-2 text-base text-slate-200 font-medium">
            आधिकारिक नियम, शर्तें एवं कार्यप्रणाली (Rules & Terms of Service)
          </p>
          <p className="mt-1 text-xs text-amber-300 font-semibold">
            कृपया ग्रुप में भाग लेने से पूर्व निम्नलिखित सभी 9 नियमों को ध्यानपूर्वक पढ़ें।
          </p>
        </div>

        <div className="p-6 sm:p-10 divide-y divide-slate-100">
          {rules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div key={rule.id} className="py-6 first:pt-0 last:pb-0 flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-brand-600 mt-1">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{rule.title}</h3>
                  <p className="mt-1.5 text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                    {rule.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-6 sm:p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            ग्रुप में जुड़कर अथवा लॉगिन करके प्रत्येक सदस्य इन सभी नियमों की पूर्ण सहमति देता है।
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 text-sm transition"
            >
              लॉगिन करें (Go to Login)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
