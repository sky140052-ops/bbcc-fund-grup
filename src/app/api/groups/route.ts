import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";
import {
  dbGetActiveGroup,
  dbFindGroupMembers,
  dbFindUsers,
  dbFindContributions,
  dbFindPayouts,
  dbInsertGroup,
} from "../../../lib/astra";
import { sanitize } from "../../../lib/crypto";
import { FundGroup } from "../../../lib/types";

export async function GET(req: NextRequest) {
  const group = await dbGetActiveGroup();

  if (!group) {
    return NextResponse.json({
      group: null,
      members: [],
      total_members: 0,
      paid_members_count: 0,
      pending_members_count: 0,
      total_collected_lifetime: 0,
      total_disbursed_lifetime: 0,
      available_pool_balance: 0,
      monthly_target: 0,
    });
  }

  // Get members assigned to this group
  const groupMemberships = await dbFindGroupMembers(group._id);
  const memberUserIds = groupMemberships.map((gm) => gm.user_id);

  // Fetch users
  const allUsers = await dbFindUsers();
  const groupUsers = allUsers.filter((u) => memberUserIds.includes(u._id));

  // Fetch contributions & payouts
  const contributions = await dbFindContributions(group._id);
  const payouts = await dbFindPayouts(group._id);

  const members = groupUsers.map((u) => {
    const contribution = contributions.find(
      (c) =>
        c.user_id === u._id &&
        c.cycle_month === group.current_cycle_month &&
        c.status === "paid"
    );

    const membership = groupMemberships.find((gm) => gm.user_id === u._id);

    return {
      _id: u._id,
      name: u.name,
      role: u.role,
      mobile: u.mobile,
      dob: u.dob,
      aadhaar_last4: u.aadhaar_last4,
      pan: u.pan,
      bank_details: u.bank_details,
      payment_status: contribution ? "paid" : "pending",
      paid_amount: contribution ? contribution.amount : 0,
      paid_at: contribution?.paid_at,
      has_received_payout: membership?.has_received_payout || false,
    };
  });

  const totalCollected = contributions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalDisbursed = payouts.reduce((sum, p) => sum + p.gross_amount, 0);
  const availablePoolBalance = Math.max(0, totalCollected - totalDisbursed);

  return NextResponse.json({
    group,
    members,
    total_members: members.length,
    paid_members_count: members.filter((m) => m.payment_status === "paid").length,
    pending_members_count: members.filter((m) => m.payment_status === "pending").length,
    total_collected_lifetime: totalCollected,
    total_disbursed_lifetime: totalDisbursed,
    available_pool_balance: availablePoolBalance,
    monthly_target: members.length * group.monthly_amount,
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || (session.role !== "founder" && session.role !== "admin")) {
    return NextResponse.json({ error: "केवल मुख्य फाउंडर ही नया ग्रुप बना सकते हैं।" }, { status: 403 });
  }

  try {
    const { name, monthly_amount, due_date_day, total_cycle_months } = await req.json();

    const cleanName = sanitize(name) || "BBCC Fund Grup";
    const amountNum = Math.max(100, Number(monthly_amount) || 5000);
    const dueDayNum = Math.min(31, Math.max(1, Number(due_date_day) || 5));
    const durationNum = Math.max(1, Number(total_cycle_months) || 12);

    const newGroup: FundGroup = {
      _id: `grp_bbcc_${Date.now()}`,
      name: cleanName,
      monthly_amount: amountNum,
      due_date_day: dueDayNum,
      total_cycle_months: durationNum,
      current_cycle_month: 1,
      status: "active",
      created_by: session.userId,
      created_at: new Date().toISOString(),
    };

    await dbInsertGroup(newGroup);

    return NextResponse.json({ success: true, group: newGroup });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json({ error: "ग्रुप बनाने में त्रुटि हुई।" }, { status: 500 });
  }
}
