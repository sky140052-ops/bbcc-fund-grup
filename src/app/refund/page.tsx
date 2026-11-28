import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata = {
  title: "रिफंड एवं रद्दीकरण नीति (Refund & Cancellation Policy) - DFI इमरजेंसी सेवा ग्रुप",
  description: "DFI इमरजेंसी सेवा ग्रुप की आधिकारिक रिफंड, डुप्लीकेट पेमेंट रद्दीकरण एवं फंड सेटलमेंट नीति",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>होमपेज पर वापस जाएं</span>
          </Link>
        </div>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
            <RefreshCw className="w-4 h-4 text-amber-300" />
            <span>भुगतान रद्दीकरण एवं धनवापसी नीति</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            रिफंड व रद्दीकरण नीति (Refund & Cancellation Policy)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            अंतिम संशोधन: 28 नवंबर 2026 • DFI इमरजेंसी सेवा ग्रुप (BBCC Fund Grup)
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              1. मासिक अंशदान की प्रकृति (Nature of Monthly Deposits)
            </h2>
            <p>
              DFI इमरजेंसी सेवा ग्रुप एक पारस्परिक बचत कम्युनिटी मॉडल पर संचालित होता है। सदस्यों द्वारा जमा किया गया मासिक अंशदान (₹100) सीधे समुदाय के संयुक्त फंड पूल में जुड़ जाता है, जिसका उपयोग बीमार अथवा जरूरतमंद सदस्यों को 1% ब्याज पर आकस्मिक लोन देने हेतु किया जाता है। अतः किसी माह का वैध अंशदान जमा हो जाने के पश्चात उसे तुरंत "सामान्य रिटर्न" के रूप में वापस नहीं लिया जा सकता।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              2. ग़लती से हुआ दोहरा भुगतान (Duplicate / Accidental Excess Payments)
            </h2>
            <p>
              यदि किसी तकनीकी त्रुटि अथवा नेटवर्क समस्या के कारण किसी सदस्य के खाते से एक ही माह में दो बार राशि (जैसे ₹103 + ₹103) कट जाती है:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <strong>विकल्प 1 (स्वतः समायोजन):</strong> सदस्य की सहमति पर अतिरिक्त राशि को अगले महीने के अंशदान में स्वतः समायोजित कर दिया जाएगा।
              </li>
              <li>
                <strong>विकल्प 2 (सीधा रिफंड):</strong> यदि सदस्य धनवापसी का अनुरोध करता है, तो UTR नंबर और बैंक प्रमाण सत्यापित करने के <strong>5 से 7 कार्य दिवसों (Working Days)</strong> के भीतर अतिरिक्त राशि मूल भुगतान स्रोत (PhonePe/UPI/बैंक खाते) में शत-प्रतिशत वापस कर दी जाएगी।
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              3. असफल ट्रांजैक्शन की स्थिति (Failed Transactions)
            </h2>
            <p>
              यदि सदस्य के बैंक खाते से पैसे कट गए हों परंतु पोर्टल पर पेमेंट असफल (Failed) दिखाई दे रहा हो, तो NPCI / PhonePe गाइडलाइंस के अनुसार 24 से 48 घंटे के भीतर बैंक द्वारा वह राशि सदस्य के खाते में स्वतः वापस (Auto-Reversal) कर दी जाती है। यदि 48 घंटे बाद भी राशि प्राप्त न हो, तो सदस्य हमारे हेल्पलाइन नंबर <strong>+91 7543952488</strong> पर संपर्क कर सकते हैं।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              4. सदस्यता रद्दीकरण एवं फंड वापसी (Membership Exit & Fund Settlement)
            </h2>
            <p>
              यदि कोई सदस्य स्वेच्छा से ग्रुप की सदस्यता छोड़ना चाहता है:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>सदस्य को एडमिन पोर्टल पर लिखित/ईमेल आवेदन देना होगा।</li>
              <li>उस समय तक सदस्य द्वारा जमा की गई कुल संचित मूल राशि (उसके द्वारा लिए गए किसी बकाया लोन अथवा ब्याज को काटकर) चालू चक्र की समाप्ति पर पूर्णतः वापस कर दी जाएगी।</li>
            </ul>
          </section>

          <section className="space-y-2 pt-2 border-t border-slate-100">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              5. रिफंड अनुरोध कहाँ भेजें (How to Request a Refund)
            </h2>
            <p>
              रिफंड अथवा पेमेंट विवाद हेतु सदस्य अपनी ट्रांजैक्शन आईडी (UTR No.), पेमेंट डेट और स्क्रीनशॉट के साथ नीचे संपर्क कर सकते हैं:
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs font-semibold">
              <p><strong>हेल्पलाइन कॉल:</strong> +91 7543952488</p>
              <p><strong>WhatsApp सहायता:</strong> +91 7543952488</p>
              <p><strong>ईमेल:</strong> sky140052@gmail.com</p>
              <p><strong>कार्यालय पता:</strong> दहिला, परजुआर, अरेर, मधुबनी, बिहार - 847229</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
