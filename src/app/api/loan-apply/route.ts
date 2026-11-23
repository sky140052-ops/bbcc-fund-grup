import { NextRequest, NextResponse } from "next/server";
import {
  dbFindMembers,
  dbFindMemberById,
  dbFindContributions,
  dbFindLoans,
  dbInsertLoan,
} from "../../../lib/astra";
import { sanitize } from "../../../lib/crypto";
import { Loan } from "../../../lib/types";
import { sendLoanApplicationEmail } from "../../../lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "lookup_aadhaar";

    // 1. Step 1: Look up member by 12-digit Aadhaar number
    if (action === "lookup_aadhaar") {
      const cleanAadhaar = sanitize(body.aadhaar_number || "").replace(/\D/g, "");
      if (cleanAadhaar.length !== 12) {
        return NextResponse.json({ error: "कृपया 12-अंकों का वैध आधार नंबर दर्ज करें।" }, { status: 400 });
      }

      const members = await dbFindMembers();
      const member = members.find((m) => m.aadhaar_number && m.aadhaar_number.replace(/\D/g, "") === cleanAadhaar);

      if (!member) {
        return NextResponse.json(
          { error: "यह आधार नंबर पंजीकृत सदस्यों के रिकॉर्ड में नहीं मिला। कृपया अपने एडमिन से संपर्क करें या नया पंजीकरण कराएं।" },
          { status: 404 }
        );
      }

      // Calculate total approved contributions deposited by this member
      const allContributions = await dbFindContributions();
      const memberContributions = allContributions.filter(
        (c) => (c.member_id === member._id || (c as any).user_id === member._id) && c.status === "paid"
      );
      const totalDeposited = memberContributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const maxEligibleLoan = Math.floor(totalDeposited * 0.90);

      // Check if member already has an active loan
      const allLoans = await dbFindLoans();
      const memberLoans = allLoans.filter((l) => l.member_id === member._id);
      const activeLoan = memberLoans.find((l) => l.status === "pending" || l.status === "disbursed");

      return NextResponse.json({
        success: true,
        member: {
          _id: member._id,
          name: member.name,
          mobile_masked: member.mobile ? `XXXXXX${member.mobile.slice(-4)}` : "—",
          email_masked: member.email ? `${member.email.slice(0, 3)}***@${member.email.split("@")[1] || "gmail.com"}` : "—",
          aadhaar_masked: `XXXXXXXX${cleanAadhaar.slice(-4)}`,
          upi_id: member.upi_id || "",
          account_number: member.account_number ? `XXXX${member.account_number.slice(-4)}` : "",
          ifsc: member.ifsc || "",
          wallet_number: member.wallet_number || "",
        },
        total_deposited: totalDeposited,
        max_eligible_loan: maxEligibleLoan,
        has_active_loan: !!activeLoan,
        active_loan_status: activeLoan?.status || null,
        active_loan_amount: activeLoan?.requested_amount || null,
      });
    }

    // 2. Step 2: Submit Loan Application
    if (action === "apply_loan") {
      const memberId = body.member_id;
      const cleanAadhaar = sanitize(body.aadhaar_number || "").replace(/\D/g, "");
      const requestedAmount = Math.round(Number(body.amount) || 0);
      const reason = sanitize(body.reason || "आपातकालीन वित्तीय आवश्यकता");

      if (!memberId || cleanAadhaar.length !== 12) {
        return NextResponse.json({ error: "अमान्य अनुरोध या आधार नंबर।" }, { status: 400 });
      }

      if (requestedAmount < 10) {
        return NextResponse.json({ error: "कृपया न्यूनतम ₹10 की राशि दर्ज करें।" }, { status: 400 });
      }

      const member = await dbFindMemberById(memberId);
      if (!member || member.aadhaar_number?.replace(/\D/g, "") !== cleanAadhaar) {
        return NextResponse.json({ error: "सदस्य सत्यापन विफल।" }, { status: 400 });
      }

      // Verify Total Deposit & Max 90% Eligibility
      const allContributions = await dbFindContributions();
      const memberTotalDeposited = allContributions
        .filter((c) => (c.member_id === memberId || (c as any).user_id === memberId) && c.status === "paid")
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

      const maxEligibleAmount = Math.floor(memberTotalDeposited * 0.90);

      if (memberTotalDeposited <= 0) {
        return NextResponse.json(
          { error: "आपने अभी तक कोई अंशदान जमा नहीं किया है। लोन लेने के लिए कम से कम एक जमा होना आवश्यक है।" },
          { status: 400 }
        );
      }

      if (requestedAmount > maxEligibleAmount) {
        return NextResponse.json(
          {
            error: `आपकी अधिकतम लोन पात्रता ₹${maxEligibleAmount} है (आपकी कुल जमा राशि ₹${memberTotalDeposited} का 90%)।`,
          },
          { status: 400 }
        );
      }

      // Check active loan
      const existingLoans = await dbFindLoans();
      const hasUnresolvedLoan = existingLoans.some(
        (l) => l.member_id === memberId && (l.status === "pending" || l.status === "disbursed")
      );

      if (hasUnresolvedLoan) {
        return NextResponse.json(
          { error: "आपका पहले से ही एक लोन आवेदन लंबित या सक्रिय है। कृपया पहले उसे पूरा या चुकता करें।" },
          { status: 400 }
        );
      }

      // 10% Fee Breakdown
      const processingFeePercent = 10;
      const processingFeeAmount = Math.round(requestedAmount * 0.10);
      const disbursedAmount = requestedAmount - processingFeeAmount; // 90% net to member

      const newLoan: Loan = {
        _id: `loan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        member_id: member._id,
        member_name: member.name,
        member_mobile: member.mobile,
        member_upi: member.upi_id || "",
        member_wallet: member.wallet_number || "",
        member_account: member.account_number || "",
        member_ifsc: member.ifsc || "",
        requested_amount: requestedAmount,
        processing_fee_percent: processingFeePercent,
        processing_fee_amount: processingFeeAmount,
        disbursed_amount: disbursedAmount,
        interest_rate_monthly: 1, // 1% p.m.
        status: "pending",
        requested_at: new Date().toISOString(),
        reason,
      };

      await dbInsertLoan(newLoan);

      // Trigger Email Notification to Admin & Member
      sendLoanApplicationEmail({
        memberName: member.name,
        memberEmail: member.email,
        requestedAmount,
        disbursedAmount,
        reason,
        totalDeposit: memberTotalDeposited,
        eligibleMax: maxEligibleAmount,
      }).catch(console.warn);

      return NextResponse.json({
        success: true,
        message: `सदस्य '${member.name}', आपका ₹${requestedAmount} के लोन का आवेदन सफलतापूर्वक दर्ज हो गया है! (10% प्रोसेसिंग शुल्क कटने के बाद आपके खाते में ₹${disbursedAmount} भेजे जाएंगे)।`,
        loan: newLoan,
      });
    }

    return NextResponse.json({ error: "अमान्य एक्शन।" }, { status: 400 });
  } catch (err: any) {
    console.error("Public loan application error:", err);
    return NextResponse.json({ error: "लोन आवेदन प्रक्रिया में त्रुटि।" }, { status: 500 });
  }
}
