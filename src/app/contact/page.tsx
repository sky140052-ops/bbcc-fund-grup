import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Building2,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "संपर्क करें (Contact Us) - DFI इमरजेंसी सेवा ग्रुप",
  description: "DFI इमरजेंसी सेवा ग्रुप आधिकारिक संपर्क विवरण, डाक पता, हेल्पलाइन फ़ोन एवं ईमेल",
};

export default function ContactPage() {
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
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>आधिकारिक संपर्क एवं कार्यालय विवरण</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              संपर्क करें (Contact Us)
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              DFI इमरजेंसी सेवा ग्रुप (BBCC Fund Grup) के सदस्य सहयोग, पूछताछ, तकनीकी सहायता अथवा पेमेंट संबंधी जानकारी हेतु नीचे दिए गए आधिकारिक पते व हेल्पलाइन पर संपर्क कर सकते हैं।
            </p>
          </div>
        </div>

        {/* Contact Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. Physical Postal Address (PhonePe / RBI Compliance Mandate) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                पंजीकृत डाक पता (Physical Postal Address)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                मुख्यालय / पंजीकृत कार्यालय
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 text-xs font-semibold leading-relaxed">
              <p className="font-bold text-slate-900">DFI इमरजेंसी सेवा ग्रुप (BBCC Fund)</p>
              <p>ग्राम व पोस्ट: दहिला (Dahila), परजुआर (Parjuar)</p>
              <p>थाना: अरेर (Arer), ज़िला: मधुबनी (Madhubani)</p>
              <p>राज्य: बिहार (Bihar) - पिन कोड: 847229</p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">देश: भारत (India)</p>
            </div>
          </div>

          {/* 2. Direct Phone & Helpline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                हेल्पलाइन फ़ोन नंबर (Business Phone)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                कॉल व WhatsApp सहायता
              </p>
            </div>
            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">कॉल सपोर्ट:</span>
                <a
                  href="tel:+917543952488"
                  className="font-mono font-black text-emerald-700 hover:underline text-sm"
                >
                  +91 7543952488
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">WhatsApp हेल्पलाइन:</span>
                <a
                  href="https://wa.me/917543952488?text=नमस्ते%20DFI%20हेल्पलाइन"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold text-emerald-700 hover:underline"
                >
                  +91 7543952488
                </a>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                * सभी सदस्य किसी भी आपातकालीन लोन या पेमेंट समस्या पर सीधे संपर्क कर सकते हैं।
              </p>
            </div>
          </div>

          {/* 3. Official Email Support */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                आधिकारिक ईमेल (Business Email)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                लिखित सहायता एवं पेमेंट पावती
              </p>
            </div>
            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-slate-800 text-xs space-y-1">
              <p className="text-slate-600 font-medium">समर्थन एवं पूछताछ ईमेल:</p>
              <a
                href="mailto:sky140052@gmail.com"
                className="font-mono font-black text-indigo-700 hover:underline text-sm block"
              >
                sky140052@gmail.com
              </a>
              <p className="text-[10px] text-slate-500 pt-1">
                ईमेल का उत्तर सामान्यतः 24 घंटे के भीतर दे दिया जाता है।
              </p>
            </div>
          </div>

          {/* 4. Operating Hours & Grievance */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                कार्य समय एवं शिकायत निवारण (Working Hours)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                सदस्य सेवा उपलब्धता
              </p>
            </div>
            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100 text-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">सोमवार - शनिवार:</span>
                <span className="font-bold text-slate-900">सुबह 09:00 - शाम 07:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">रविवार व अवकाश:</span>
                <span className="font-semibold text-amber-700">केवल आपातकालीन लोन</span>
              </div>
              <div className="pt-1 border-t border-amber-200/60 text-[10px] text-slate-600">
                <span className="font-bold">शिकायत निवारण अधिकारी:</span> मुख्य एडमिन / व्यवस्थापक
              </div>
            </div>
          </div>

        </div>

        {/* Policy Links Bar for Compliance Reviewers */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">
            कानूनी नीतियां एवं दिशा-निर्देश (Legal Policies)
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/terms"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 font-bold text-slate-700 border border-slate-200 transition"
            >
              नियम व शर्तें (Terms & Conditions)
            </Link>
            <Link
              href="/privacy"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 font-bold text-slate-700 border border-slate-200 transition"
            >
              गोपनीयता नीति (Privacy Policy)
            </Link>
            <Link
              href="/refund"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 font-bold text-slate-700 border border-slate-200 transition"
            >
              रिफंड व रद्दीकरण नीति (Refund Policy)
            </Link>
            <Link
              href="/rules"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 font-bold text-slate-700 border border-slate-200 transition"
            >
              फंड के नियम व दिशानिर्देश (Group Rules)
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
