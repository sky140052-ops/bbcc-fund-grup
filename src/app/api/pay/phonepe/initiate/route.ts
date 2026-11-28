import { NextRequest, NextResponse } from "next/server";
import { getPhonePeConfig, generateChecksum } from "../../../../../lib/phonepe";
import {
  dbFindMemberById,
  dbGetSystemSettings,
  dbFindContributions,
  dbFindLoanById,
} from "../../../../../lib/astra";

export async function POST(req: NextRequest) {
  try {
    const config = getPhonePeConfig();
    if (!config.isConfigured) {
      return NextResponse.json(
        {
          error: "PhonePe गेटवे अभी कॉन्फ़िगर नहीं है। कृपया Render Environment में PHONEPE_MERCHANT_ID और PHONEPE_SALT_KEY जोड़ें।",
          configured: false,
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { member_id, action = "deposit", loan_id } = body;

    if (!member_id) {
      return NextResponse.json({ error: "सदस्य आईडी आवश्यक है।" }, { status: 400 });
    }

    const [member, settings] = await Promise.all([
      dbFindMemberById(member_id),
      dbGetSystemSettings(),
    ]);

    if (!member) {
      return NextResponse.json({ error: "सदस्य रिकॉर्ड नहीं मिला।" }, { status: 404 });
    }

    let payableAmount = 103; // Default ₹100 deposit + ₹3 fee

    // Check action
    if (action === "deposit") {
      const currentDay = new Date().getDate();
      const isDepositAllowed = (currentDay >= 1 && currentDay <= 10) || !!settings.allow_deposit_after_10th;
      if (!isDepositAllowed) {
        return NextResponse.json(
          { error: "इस माह की निर्धारित अंशदान अवधि (1 से 10 तारीख) समाप्त हो चुकी है।" },
          { status: 403 }
        );
      }

      const monthlyAmount = settings.monthly_contribution_amount || 100;
      const platformFee = settings.platform_fee !== undefined ? settings.platform_fee : 3;
      payableAmount = monthlyAmount + platformFee;

      // Check duplicate
      const currentMonth = new Date().toISOString().slice(0, 7);
      const allContributions = await dbFindContributions();
      const existing = allContributions.find(
        (c) => (c.member_id === member_id || (c as any).user_id === member_id) && c.month === currentMonth
      );
      if (existing && existing.status === "paid") {
        return NextResponse.json(
          { error: `सदस्य ${member.name} का माह ${currentMonth} का अंशदान पहले ही जमा हो चुका है!` },
          { status: 400 }
        );
      }
    } else if (action === "loan_repay" && loan_id) {
      const loan = await dbFindLoanById(loan_id);
      if (!loan || loan.status !== "disbursed") {
        return NextResponse.json({ error: "सक्रिय लोन नहीं मिला।" }, { status: 404 });
      }
      payableAmount = Number(body.amount) || loan.requested_amount;
    }

    // Amount in Paise (e.g. ₹103 -> 10300 paise)
    const amountInPaise = Math.round(payableAmount * 100);

    // Generate unique transaction ID: DFI_TXN_timestamp_random
    const merchantTransactionId = `DFI_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const host = req.nextUrl.origin || "https://bbcc-grup.onrender.com";
    const redirectUrl = `${host}/api/pay/phonepe/redirect?txnId=${merchantTransactionId}&memberId=${member._id}&action=${action}&loanId=${loan_id || ""}`;
    const callbackUrl = `${host}/api/pay/phonepe/callback`;

    // Construct PhonePe PAY_PAGE Payload
    const payload = {
      merchantId: config.merchantId,
      merchantTransactionId,
      merchantUserId: member._id,
      amount: amountInPaise,
      redirectUrl,
      redirectMode: "POST",
      callbackUrl,
      mobileNumber: member.mobile ? member.mobile.slice(-10) : "7543952488",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const endpoint = "/pg/v1/pay";
    const xVerify = generateChecksum(base64Payload, endpoint, config.saltKey, config.saltIndex);

    const phonepeResponse = await fetch(`${config.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const resData = await phonepeResponse.json();

    if (!phonepeResponse.ok || !resData?.success) {
      console.error("PhonePe initiation error:", resData);
      return NextResponse.json(
        {
          error: resData?.message || "PhonePe पेमेंट शुरू करने में विफल।",
          raw: resData,
        },
        { status: 500 }
      );
    }

    // PhonePe Redirect URL to Checkout Page / UPI App
    const checkoutUrl = resData?.data?.instrumentResponse?.redirectInfo?.url;

    return NextResponse.json({
      success: true,
      merchantTransactionId,
      checkoutUrl,
      amount: payableAmount,
      member: {
        id: member._id,
        name: member.name,
      },
    });
  } catch (err: any) {
    console.error("Initiate PhonePe error:", err);
    return NextResponse.json({ error: err.message || "सर्वर त्रुटि हुई।" }, { status: 500 });
  }
}
