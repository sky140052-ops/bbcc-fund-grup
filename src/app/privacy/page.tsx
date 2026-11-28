import Link from "next/link";
import { ArrowLeft, Shield, Lock, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "गोपनीयता नीति (Privacy Policy) - DFI इमरजेंसी सेवा ग्रुप",
  description: "DFI इमरजेंसी सेवा ग्रुप की डेटा सुरक्षा, गोपनीयता नीति, कुकीज़ एवं सदस्य जानकारी संरक्षण",
};

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>डेटा सुरक्षा एवं उपयोगकर्ता अधिकार</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            गोपनीयता नीति (Privacy Policy)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            अंतिम संशोधन: 28 नवंबर 2026 • DFI इमरजेंसी सेवा ग्रुप
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              1. हम कौन सा डेटा एकत्र करते हैं (Information We Collect)
            </h2>
            <p>
              DFI इमरजेंसी सेवा ग्रुप अपने सदस्यों के सुरक्षित प्रमाणीकरण एवं वित्तीय रिकॉर्ड के लिए निम्नलिखित न्यूनतम जानकारी एकत्र करता है:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>पूरा नाम एवं Google प्रोफाइल फ़ोटो (Google 1-Tap प्रमाणीकरण द्वारा)</li>
              <li>सत्यापित ईमेल आईडी (Gmail Address)</li>
              <li>10-अंकीय सक्रिय मोबाइल नंबर (संपर्क एवं सूचनाओं हेतु)</li>
              <li>आधार कार्ड नंबर (12 अंक) एवं पैन कार्ड नंबर (केवाईसी पहचान हेतु)</li>
              <li>बैंक खाता विवरण अथवा UPI आईडी (फंड वितरण एवं लोन प्राप्त करने हेतु)</li>
              <li>भुगतान संदर्भ / UTR नंबर (अंशदान पुष्टि हेतु)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              2. डेटा का उपयोग (How We Use Your Information)
            </h2>
            <p>
              एकत्रित की गई जानकारी का उपयोग केवल निम्नलिखित आंतरिक उद्देश्यों के लिए किया जाता है:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>सदस्य की पहचान और प्रामाणिकता सत्यापित करने के लिए।</li>
              <li>मासिक बचत जमा और आकस्मिक लोन की स्थिति को पारदर्शी रूप से दर्ज करने के लिए।</li>
              <li>PhonePe Payment Gateway के माध्यम से सुरक्षित पेमेंट प्रोसेस करने के लिए।</li>
              <li>ईमेल पर मासिक रसीदें, लोन स्वीकृति तथा पेमेंट अलर्ट भेजने के लिए।</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              3. डेटा सुरक्षा एवं भंडारण (Data Security & Storage)
            </h2>
            <p>
              हम आपके व्यक्तिगत डेटा की सुरक्षा को सर्वोच्च प्राथमिकता देते हैं। हमारे सभी डेटाबेस (Astra DB / Cloud) उद्योग-मानक एन्क्रिप्शन, फ़ायरवॉल और सुरक्षित टोकन (JWT) प्रमाणीकरण द्वारा संरक्षित हैं।
            </p>
            <p>
              <strong>शून्य साझाकरण (No Third-Party Sharing):</strong> हम किसी भी तीसरे पक्ष, मार्केटिंग कंपनी या विज्ञापनदाता को आपका व्यक्तिगत डेटा कभी भी नहीं बेचते, किराए पर नहीं देते और न ही साझा करते हैं।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              4. कुकीज़ एवं स्थानीय संग्रहण (Cookies & Storage)
            </h2>
            <p>
              पोर्टल केवल सुरक्षित सत्र बनाए रखने के लिए आवश्यक HTTP कुकीज़ (जैसे <code>bbcc_session</code>) और स्थानीय संग्रहण (Local Storage) का उपयोग करता है ताकि सदस्य को बार-बार लॉगिन न करना पड़े।
            </p>
          </section>

          <section className="space-y-2 pt-2 border-t border-slate-100">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              5. गोपनीयता प्रश्न एवं शिकायत निवारण (Privacy Contact)
            </h2>
            <p>
              गोपनीयता नीति अथवा अपने व्यक्तिगत डेटा के संबंध में किसी भी पूछताछ हेतु आप सीधे हमारे डेटा सुरक्षा प्रभारी से संपर्क कर सकते हैं:
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs font-semibold">
              <p><strong>प्रभारी:</strong> मुख्य एडमिन, DFI इमरजेंसी सेवा ग्रुप</p>
              <p><strong>डाक पता:</strong> दहिला, परजुआर, अरेर, मधुबनी, बिहार - 847229</p>
              <p><strong>ईमेल:</strong> sky140052@gmail.com</p>
              <p><strong>फ़ोन:</strong> +91 7543952488</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
