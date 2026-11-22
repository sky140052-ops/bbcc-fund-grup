import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import {
  dbFindMembers,
  dbFindContributions,
  dbFindLoans,
} from "../../../../lib/astra";
import * as XLSX from "xlsx";

function getAdminSession(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  if (!token) return null;
  const session = verifyToken(token);
  if (!session) return null;
  if (session.role === "admin" || session.role === "founder") {
    return session;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "अनधिकृत अनुरोध। केवल एडमिन ही डेटा एक्सपोर्ट कर सकते हैं।" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    const exportType = url.searchParams.get("type") || "all";

    const [members, contributions, loans] = await Promise.all([
      dbFindMembers(),
      dbFindContributions(),
      dbFindLoans(),
    ]);

    // Format Members Data for Excel
    const membersData = members.map((m, idx) => ({
      "क्र.सं. (S.No)": idx + 1,
      "सदस्य ID": m._id,
      "नाम (Name)": m.name || "",
      "मोबाइल (Mobile)": m.mobile || "",
      "ईमेल (Email)": m.email || "",
      "आधार कार्ड नंबर": m.aadhaar_number ? `'${m.aadhaar_number}` : "",
      "पैन कार्ड नंबर": m.pan_number || "",
      "UPI ID": m.upi_id || "",
      "PhonePe / Google Pay नंबर": m.wallet_number || "",
      "बैंक खाता नंबर": m.account_number ? `'${m.account_number}` : "",
      "IFSC कोड": m.ifsc || "",
      "बैंक का नाम": m.bank_name || "",
      "पंजीकरण तारीख": m.created_at ? new Date(m.created_at).toLocaleString("hi-IN") : "",
    }));

    // Format Contributions / Transactions Data for Excel
    const contributionsData = contributions.map((c, idx) => ({
      "क्र.सं. (S.No)": idx + 1,
      "रसीद ID": c._id,
      "सदस्य का नाम": c.member_name || "",
      "मोबाइल": c.member_mobile || "",
      "जमा राशि (₹)": Number(c.amount) || 0,
      "माह (Month)": c.month || "",
      "जमा तारीख": c.paid_at ? new Date(c.paid_at).toLocaleString("hi-IN") : "",
      "पेमेंट रेफरेंस / ID": c.razorpay_payment_id || "",
      "स्थिति": c.status === "paid" ? "सफल जमा (Paid)" : (c.status || "Paid"),
    }));

    // Format Loans Data for Excel
    const loansData = loans.map((l, idx) => ({
      "क्र.सं. (S.No)": idx + 1,
      "लोन ID": l._id,
      "सदस्य का नाम": l.member_name || "",
      "मोबाइल": l.member_mobile || "",
      "UPI / PhonePe": l.member_upi || l.member_wallet || "",
      "बैंक खाता": l.member_account ? `'${l.member_account}` : "",
      "IFSC": l.member_ifsc || "",
      "आवेदन राशि (₹)": l.requested_amount || 0,
      "10% प्रोसेसिंग फीस (₹)": l.processing_fee_amount || 0,
      "खाते में भेजी गई राशि (90%) (₹)": l.disbursed_amount || 0,
      "संचित ब्याज (1% p.m.) (₹)": l.interest_accumulated || 0,
      "कुल देय राशि (₹)": l.total_payable || l.requested_amount || 0,
      "स्थिति":
        l.status === "repaid"
          ? "चुकता (Repaid)"
          : l.status === "disbursed"
          ? "सक्रिय लोन (Active)"
          : l.status === "rejected"
          ? "अस्वीकृत (Rejected)"
          : "लंबित (Pending)",
      "आवेदन तारीख": l.requested_at ? new Date(l.requested_at).toLocaleString("hi-IN") : "",
      "डिस्बर्सल तारीख": l.disbursed_at ? new Date(l.disbursed_at).toLocaleString("hi-IN") : "",
      "बैंक UTR नंबर": l.transaction_utr || "",
      "स्क्रीनशॉट प्रमाण URL": l.payment_screenshot ? "(स्क्रीनशॉट पोर्टल पर सुरक्षित)" : "",
      "चुकता तारीख": l.repaid_at ? new Date(l.repaid_at).toLocaleString("hi-IN") : "",
      "चुकता पेमेंट ID": l.repayment_razorpay_id || "",
      "कुल चुकता राशि (₹)": l.total_repaid || "",
      "एडमिन नोट्स / कारण": l.admin_notes || l.reason || "",
    }));

    // Create Excel Workbook
    const wb = XLSX.utils.book_new();
    const todayStr = new Date().toISOString().split("T")[0];
    let fileName = `DFI_Master_Records_${todayStr}.xlsx`;

    if (exportType === "members") {
      const wsMembers = XLSX.utils.json_to_sheet(membersData);
      XLSX.utils.book_append_sheet(wb, wsMembers, "सदस्य सूची (Members)");
      fileName = `DFI_Members_${todayStr}.xlsx`;
    } else if (exportType === "contributions") {
      const wsContrib = XLSX.utils.json_to_sheet(contributionsData);
      XLSX.utils.book_append_sheet(wb, wsContrib, "जमा लेन-देन (Deposits)");
      fileName = `DFI_Transactions_${todayStr}.xlsx`;
    } else if (exportType === "loans") {
      const wsLoans = XLSX.utils.json_to_sheet(loansData);
      XLSX.utils.book_append_sheet(wb, wsLoans, "लोन इतिहास (Loans)");
      fileName = `DFI_Loans_${todayStr}.xlsx`;
    } else {
      // Default: All sheets in single workbook
      const wsMembers = XLSX.utils.json_to_sheet(membersData);
      const wsContrib = XLSX.utils.json_to_sheet(contributionsData);
      const wsLoans = XLSX.utils.json_to_sheet(loansData);

      XLSX.utils.book_append_sheet(wb, wsMembers, "सदस्य सूची (Members)");
      XLSX.utils.book_append_sheet(wb, wsContrib, "जमा लेन-देन (Deposits)");
      XLSX.utils.book_append_sheet(wb, wsLoans, "लोन इतिहास (Loans)");
      fileName = `DFI_Master_Records_${todayStr}.xlsx`;
    }

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    console.error("Export Excel error:", err);
    return NextResponse.json(
      { error: err.message || "एक्सेल फाइल तैयार करने में त्रुटि।" },
      { status: 500 }
    );
  }
}
