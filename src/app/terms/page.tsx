import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "नियम व शर्तें (Terms & Conditions) - DFI इमरजेंसी सेवा ग्रुप",
  description: "DFI इमरजेंसी सेवा ग्रुप के आधिकारिक नियम, शर्तें, अंशदान नियम एवं कानूनी प्रावधान",
};

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <FileText className="w-4 h-4 text-blue-300" />
            <span>आधिकारिक नियम व सेवा शर्तें</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            नियम एवं शर्तें (Terms and Conditions)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            अंतिम संशोधन: 28 नवंबर 2026 • DFI इमरजेंसी सेवा ग्रुप (BBCC Fund Grup)
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              1. परिचय एवं संस्था का उद्देश्य (Introduction & Purpose)
            </h2>
            <p>
              DFI इमरजेंसी सेवा ग्रुप (जिसे "संस्था", "ग्रुप" अथवा "हम" कहा गया है) एक पारदर्शी, गैर-सट्टेबाजी, म्यूचुअल सहायता कम्युनिटी फंड है, जिसका पंजीकृत कार्यालय <strong>ग्राम व पोस्ट: दहिला, परजुआर, थाना: अरेर, ज़िला: मधुबनी, बिहार - 847229</strong> में स्थित है। इस पोर्टल का उद्देश्य ग्रुप के पंजीकृत सदस्यों के बीच पारस्परिक बचत को बढ़ावा देना तथा आकस्मिक बीमारी या ज़रूरत पड़ने पर कम ब्याज (1% प्रतिमाह) पर वित्तीय सहायता उपलब्ध कराना है।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              2. सदस्यता पात्रता एवं सत्यापन (Membership Eligibility & KYC)
            </h2>
            <p>
              पोर्टल पर केवल 18 वर्ष या उससे अधिक आयु के भारतीय नागरिक ही सदस्य बन सकते हैं। सदस्य बनने हेतु आधार कार्ड, 10-अंकीय मोबाइल नंबर तथा Google/ईमेल का प्रमाणीकरण अनिवार्य है। किसी भी असत्य जानकारी या फ़र्ज़ी दस्तावेज़ पाए जाने पर सदस्यता तत्काल प्रभाव से रद्द कर दी जाएगी।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              3. मासिक अंशदान नियम (Monthly Contribution Rules)
            </h2>
            <p>
              प्रत्येक पंजीकृत सदस्य को प्रति माह 1 से 10 तारीख के बीच निर्धारित मासिक अंशदान (₹100) तथा ₹3 फिक्स प्लेटफ़ॉर्म अनुरक्षण शुल्क (कुल ₹103) का भुगतान PhonePe, Google Pay, UPI अथवा बैंक ट्रांसफर के माध्यम से करना अनिवार्य है। 10 तारीख के पश्चात जमा पोर्टल स्वतः बंद हो जाता है, जब तक कि विशेष परिस्थिति में एडमिन द्वारा अनुमति न दी जाए।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              4. आकस्मिक लोन एवं ब्याज दर (Emergency Loan & Interest Policy)
            </h2>
            <p>
              आवश्यकता पड़ने पर कोई भी सदस्य अपनी कुल जमा पूंजी का अधिकतम 90% तक आकस्मिक लोन हेतु आवेदन कर सकता है। लोन राशि सीधे सदस्य के बैंक अथवा UPI खाते में हस्तांतरित की जाती है। इस पर प्रति माह 1% (यानी ₹1 प्रति ₹100 प्रतिमाह) साधारण ब्याज देय होगा। लोन की अदायगी अधिकतम 15 तारीख तक की जानी अनिवार्य है।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              5. पेमेंट गेटवे एवं सुरक्षा (Payment Processing Security)
            </h2>
            <p>
              सभी डिजिटल भुगतान PhonePe Payment Gateway / Razorpay एवं अधिकृत UPI चैनल्स के माध्यम से 256-बिट SSL एन्क्रिप्शन के साथ प्रोसेस किए जाते हैं। हम किसी भी सदस्य का बैंक पासवर्ड, UPI पिन अथवा गोपनीय क्रेडेंशियल कभी भी अपने सर्वर पर स्टोर नहीं करते हैं।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              6. विवाद निवारण एवं क्षेत्राधिकार (Governing Law & Jurisdiction)
            </h2>
            <p>
              यह समझौता भारतीय कानूनों के तहत शासित होगा। किसी भी प्रकार के कानूनी विवाद की स्थिति में केवल मधुबनी, बिहार (Madhubani, Bihar) की सक्षम अदालतों का ही विशेष क्षेत्राधिकार होगा।
            </p>
          </section>

          <section className="space-y-2 pt-2 border-t border-slate-100">
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              7. संपर्क विवरण (Contact Details)
            </h2>
            <p>
              नियमों अथवा सेवाओं के संबंध में किसी भी स्पष्टीकरण हेतु सदस्य संपर्क कर सकते हैं:
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs font-semibold">
              <p><strong>संस्था:</strong> DFI इमरजेंसी सेवा ग्रुप</p>
              <p><strong>पता:</strong> दहिला, परजुआर, अरेर, मधुबनी, बिहार - 847229</p>
              <p><strong>फ़ोन:</strong> +91 7543952488</p>
              <p><strong>ईमेल:</strong> sky140052@gmail.com</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
