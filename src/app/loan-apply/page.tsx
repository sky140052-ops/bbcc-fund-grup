"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  User,
  Wallet,
  Clock,
  Info,
  Calendar,
  ChevronRight,
} from "lucide-react";

interface MemberData {
  _id: string;
  name: string;
  mobile_masked: string;
  email_masked: string;
  aadhaar_masked: string;
  upi_id?: string;
  account_number?: string;
  ifsc?: string;
  wallet_number?: string;
}

export default function PublicLoanApplyPage() {
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [member, setMember] = useState<MemberData | null>(null);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [maxEligible, setMaxEligible] = useState(0);
  const [hasActiveLoan, setHasActiveLoan] = useState(false);
  const [activeLoanStatus, setActiveLoanStatus] = useState<string | null>(null);

  // Application form state
  const [requestedAmount, setRequestedAmount] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Look up Aadhaar
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAadhaar = aadhaarInput.replace(/\D/g, "");
    if (cleanAadhaar.length !== 12) {
      setLookupError("कृपया 12-अंकों का वैध आधार नंबर दर्ज करें।");
      return;
    }

    setLookingUp(true);
    setLookupError("");
    setMember(null);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const res = await fetch("/api/loan-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lookup_aadhaar",
          aadhaar_number: cleanAadhaar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "आधार सत्यापन में त्रुटि।");
      }

      setMember(data.member);
      setTotalDeposited(data.total_deposited || 0);
      setMaxEligible(data.max_eligible_loan || 0);
      setHasActiveLoan(data.has_active_loan || false);
      setActiveLoanStatus(data.active_loan_status || null);
      if (data.max_eligible_loan > 0) {
        setRequestedAmount(data.max_eligible_loan);
      }
    } catch (err: any) {
      setLookupError(err.message || "विवरण प्राप्त करने में त्रुटि।");
    } finally {
      setLookingUp(false);
    }
  };

  // Submit loan
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    const numAmount = Number(requestedAmount);
    if (!numAmount || numAmount < 10) {
      setSubmitError("कृपया कम से कम ₹10 की राशि दर्ज करें।");
      return;
    }

    if (numAmount > maxEligible) {
      setSubmitError(`आपकी अधिकतम लोन पात्रता ₹${maxEligible} है। इससे अधिक आवेदन नहीं किया जा सकता।`);
      return;
    }

    if (!reason.trim()) {
      setSubmitError("कृपया लोन का कारण अवश्य दर्ज करें।");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch("/api/loan-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_loan",
          member_id: member._id,
          aadhaar_number: aadhaarInput.replace(/\D/g, ""),
          amount: numAmount,
          reason,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "लोन आवेदन विफल।");
      }

      setSubmitSuccess(result.message);
      setHasActiveLoan(true);
    } catch (err: any) {
      setSubmitError(err.message || "आवेदन प्रक्रिया में त्रुटि।");
    } finally {
      setSubmitting(false);
    }
  };

  const reqNum = Number(requestedAmount) || 0;
  const processingFee = Math.round(reqNum * 0.10);
  const netDisbursed = Math.max(0, reqNum - processingFee);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/20">
              DFI
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                इमरजेंसी सेवा ग्रुप
                <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30">
                  Loan Portal
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">आधार आधारित त्वरित लोन आवेदन (1% ब्याज)</p>
            </div>
          </div>

          <Link
            href="/pay"
            className="text-xs font-semibold px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1 transition"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>भुगतान लिंक</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex-1 space-y-6">
        {/* Rules Overview Banner */}
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 text-xs sm:text-sm text-blue-200 shadow-xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-white">
            <Info className="w-4 h-4 text-blue-400" />
            <span>DFI लोन नियम व पात्रता निर्देश</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-blue-300/90 text-xs pl-1">
            <li>
              <b>पात्रता (90%):</b> आप अपनी कुल जमा अंशदान राशि का अधिकतम 90% तक लोन ले सकते हैं।
            </li>
            <li>
              <b>प्रोसेसिंग शुल्क (10%):</b> लोन स्वीकृति पर 10% शुल्क काटकर शेष 90% राशि आपके खाते में भेजी जाती है।
            </li>
            <li>
              <b>मासिक ब्याज:</b> केवल 1% प्रति माह साधारण ब्याज दर लागू होती है।
            </li>
          </ul>
        </div>

        {/* Step 1: Enter Aadhaar Number */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Search className="w-4 h-4 text-blue-400" />
              <span>1. अपना आधार नंबर दर्ज करें</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              पंजीकृत सदस्य अपना 12-अंकों का आधार कार्ड नंबर दर्ज करके पात्रता जांचें
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                आधार संख्या (12 अंक) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={12}
                  required
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456789012"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {lookupError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{lookupError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={lookingUp || aadhaarInput.replace(/\D/g, "").length !== 12}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {lookingUp ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>आधार रिकॉर्ड खोजा जा रहा है...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>विवरण व पात्रता जांचें</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Step 2: Member Details & Loan Form */}
        {member && (
          <div className="space-y-6">
            {/* Member Profile Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{member.name}</h3>
                    <p className="text-xs text-slate-400">
                      आधार: <span className="font-mono text-slate-300">{member.aadhaar_masked}</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2 py-1 rounded-lg border border-emerald-500/20">
                  सत्यापित सदस्य
                </span>
              </div>

              {/* Deposit & Max Loan Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    कुल संचित अंशदान
                  </span>
                  <span className="text-lg font-black text-white block mt-0.5">
                    ₹{totalDeposited}
                  </span>
                  <span className="text-[10px] text-slate-500 block">स्वीकृत बचत राशि</span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-blue-900/50">
                  <span className="text-[10px] text-blue-400 uppercase tracking-wider block font-bold">
                    अधिकतम लोन पात्रता (90%)
                  </span>
                  <span className="text-lg font-black text-blue-400 block mt-0.5">
                    ₹{maxEligible}
                  </span>
                  <span className="text-[10px] text-slate-500 block">कुल बचत का 90%</span>
                </div>
              </div>

              {/* Payment Info on record */}
              <div className="p-3 bg-slate-950/70 rounded-xl text-xs space-y-1 text-slate-400 border border-slate-800/80">
                <p>
                  <b className="text-slate-300">रजिस्टर्ड UPI:</b> {member.upi_id || "उपलब्ध नहीं"}
                </p>
                {member.account_number && (
                  <p>
                    <b className="text-slate-300">बैंक खाता:</b> {member.account_number} (IFSC: {member.ifsc || "—"})
                  </p>
                )}
                {member.wallet_number && (
                  <p>
                    <b className="text-slate-300">वॉलेट नंबर:</b> {member.wallet_number}
                  </p>
                )}
              </div>
            </div>

            {/* Check Active Loan Status */}
            {hasActiveLoan && !submitSuccess && (
              <div className="p-5 bg-amber-950/60 border border-amber-800 rounded-2xl text-amber-200 shadow-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>आपके पास पहले से एक सक्रिय या लंबित लोन है</span>
                </div>
                <p className="text-xs text-amber-300">
                  स्थिति: <b>{activeLoanStatus === "pending" ? "स्वीकृति हेतु लंबित (Pending)" : "सक्रिय / चालू (Disbursed)"}</b>
                </p>
                <p className="text-xs text-amber-400/90">
                  नया लोन आवेदन करने से पहले वर्तमान लोन का चुकता होना अनिवार्य है। आप भुगतान पेज पर जाकर लोन अदा कर सकते हैं।
                </p>
                <Link
                  href="/pay"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-lg transition mt-2"
                >
                  <span>लोन किश्त का भुगतान करें</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Check Zero Deposit */}
            {totalDeposited <= 0 && !hasActiveLoan && (
              <div className="p-5 bg-rose-950/60 border border-rose-800 rounded-2xl text-rose-200 shadow-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <span>कोई अंशदान संचित नहीं है</span>
                </div>
                <p className="text-xs text-rose-300">
                  लोन प्राप्त करने हेतु कम से कम एक माह का अंशदान जमा होना आवश्यक है। कृपया पहले ₹100 का मासिक अंशदान जमा करें।
                </p>
                <Link
                  href="/pay"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition mt-2"
                >
                  <span>₹100 अंशदान जमा करें</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Success Card after submitting */}
            {submitSuccess && (
              <div className="p-6 bg-emerald-950/70 border border-emerald-700 rounded-2xl text-emerald-200 shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">लोन आवेदन सफलतापूर्वक दर्ज हुआ!</h3>
                    <p className="text-xs text-emerald-300">
                      एडमिन को आपका आवेदन भेज दिया गया है।
                    </p>
                  </div>
                </div>
                <p className="text-xs text-emerald-200 bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/50">
                  {submitSuccess}
                </p>
                <p className="text-xs text-slate-400">
                  एडमिन द्वारा लोन स्वीकृत कर राशि आपके UPI/बैंक खाते में स्थानांतरित की जाएगी और पुष्टिकरण ईमेल भेजा जाएगा।
                </p>
              </div>
            )}

            {/* Application Form: Only if eligible and no active loan */}
            {maxEligible > 0 && !hasActiveLoan && !submitSuccess && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>2. लोन राशि व कारण दर्ज करें</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    अधिकतम पात्रता ₹{maxEligible} के अंतर्गत आवश्यक राशि चुनें
                  </p>
                </div>

                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        आवश्यक लोन राशि (₹) *
                      </label>
                      <span className="text-xs font-bold text-emerald-400">
                        अधिकतम: ₹{maxEligible}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={10}
                      max={maxEligible}
                      required
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(Number(e.target.value) || "")}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Breakdown Box */}
                  {reqNum > 0 && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>आवेदन राशि:</span>
                        <span className="font-bold font-mono">₹{reqNum}</span>
                      </div>
                      <div className="flex justify-between text-rose-400">
                        <span>10% प्रोसेसिंग शुल्क (कटौती):</span>
                        <span className="font-bold font-mono">-₹{processingFee}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 border-t border-slate-800 pt-2 text-sm font-bold">
                        <span>आपके खाते में भेजी जाने वाली शुद्ध राशि:</span>
                        <span className="font-mono text-base">₹{netDisbursed}</span>
                      </div>
                      <div className="flex justify-between text-amber-400 text-[11px] pt-1">
                        <span>मासिक ब्याज दर:</span>
                        <span>1% प्रति माह (किश्त अदायगी के समय देय)</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      लोन का कारण *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="उदा. आपातकालीन चिकित्सा, दवाइयों या आवश्यक पारिवारिक कार्य हेतु..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {submitError && (
                    <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || reqNum <= 0 || reqNum > maxEligible}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>लोन आवेदन भेजा जा रहा है...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>₹{reqNum} लोन हेतु आवेदन जमा करें</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>© 2026 DFI इमरजेंसी सेवा ग्रुप • पारदर्शी बचत एवं वित्तीय सहयोग पोर्टल</p>
      </footer>
    </div>
  );
}
