import { NextRequest, NextResponse } from "next/server";
import { getPhonePeConfig, verifyChecksum } from "../../../../../lib/phonepe";
import {
  dbFindContributions,
  dbUpdateContribution,
  dbInsertContribution,
  dbFindMemberById,
} from "../../../../../lib/astra";
import { Contribution } from "../../../../../lib/types";

export async function POST(req: NextRequest) {
  try {
    const config = getPhonePeConfig();
    const xVerify = req.headers.get("x-verify") || "";
    const body = await req.json();

    const responseBase64 = body.response;
    if (!responseBase64) {
      return NextResponse.json({ error: "No response payload" }, { status: 400 });
    }

    // Verify signature
    if (!verifyChecksum(responseBase64, config.saltKey, config.saltIndex, xVerify)) {
      console.warn("PhonePe callback checksum mismatch");
      return NextResponse.json({ error: "Invalid checksum" }, { status: 403 });
    }

    const decodedString = Buffer.from(responseBase64, "base64").toString("utf-8");
    const payload = JSON.parse(decodedString);

    if (payload.success && payload.code === "PAYMENT_SUCCESS") {
      const data = payload.data;
      const merchantTransactionId = data.merchantTransactionId;
      const memberId = data.merchantUserId;
      const nowIso = new Date().toISOString();
      const currentMonth = nowIso.slice(0, 7);

      const allContributions = await dbFindContributions();
      const existing = allContributions.find(
        (c) => (c.member_id === memberId || (c as any).user_id === memberId) && c.month === currentMonth
      );

      if (existing) {
        await dbUpdateContribution(existing._id, {
          status: "paid",
          auto_approved: true,
          approved_at: nowIso,
          paid_at: nowIso,
          transaction_id: data.transactionId || merchantTransactionId,
          note: "PhonePe Webhook द्वारा स्वतः सत्यापित",
        });
      } else {
        const member = await dbFindMemberById(memberId);
        const newContrib: Contribution = {
          _id: `cntr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          member_id: memberId,
          member_name: member?.name || "सदस्य",
          member_mobile: member?.mobile || "",
          month: currentMonth,
          amount: 100,
          platform_fee: 3,
          total_paid: (data.amount || 10300) / 100,
          status: "paid",
          paid_at: nowIso,
          submitted_at: nowIso,
          approved_at: nowIso,
          auto_approved: true,
          transaction_id: data.transactionId || merchantTransactionId,
          note: "PhonePe Webhook द्वारा स्वतः सत्यापित",
        };
        await dbInsertContribution(newContrib);
      }
    }

    return NextResponse.json({ success: true, message: "Webhook acknowledged" });
  } catch (err: any) {
    console.error("PhonePe Webhook Error:", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
