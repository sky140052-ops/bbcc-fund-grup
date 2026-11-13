import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";
import {
  dbGetActiveGroup,
  dbFindGroups,
  dbFindGroupMembers,
  dbFindAllGroupMembers,
  dbFindUsers,
  dbFindContributions,
  dbFindPayouts,
  dbInsertGroup,
  dbInsertGroupMember,
} from "../../../lib/astra";
import { sanitize } from "../../../lib/crypto";
import { FundGroup, GroupMember } from "../../../lib/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;
  const currentUserId = session?.userId;

  const allGroups = await dbFindGroups();
  const allMemberships = await dbFindAllGroupMembers();
  const allUsers = await dbFindUsers();
  const allContributions = await dbFindContributions();
  const allPayouts = await dbFindPayouts();

  // If no group exists yet, create default BBCC group
  let primaryGroup = allGroups.find((g) => g.status === "active") || allGroups[0] || null;

  if (!primaryGroup) {
    primaryGroup = {
      _id: `grp_bbcc_${Date.now()}`,
      name: "BBCC Fund Grup (मुख्य बचत समूह)",
      monthly_amount: 5000,
      due_date_day: 5,
      total_cycle_months: 12,
      current_cycle_month: 1,
      max_members: 12,
      description: "12 महीने का सुरक्षित बचत समूह, हर माह 5 तारीख को अंशदान देय।",
      status: "active",
      created_by: "system",
      created_at: new Date().toISOString(),
    };
    await dbInsertGroup(primaryGroup);
    allGroups.push(primaryGroup);
  }

  // Format all groups with metadata & user status
  const formattedGroups = allGroups.map((g) => {
    const groupMembers = allMemberships.filter((gm) => gm.group_id === g._id);
    const approvedCount = groupMembers.filter((gm) => gm.status !== "rejected" && gm.status !== "pending").length;
    const pendingCount = groupMembers.filter((gm) => gm.status === "pending").length;

    let userStatus: "approved" | "pending" | "rejected" | "none" = "none";
    if (currentUserId) {
      const myMembership = groupMembers.find((gm) => gm.user_id === currentUserId);
      if (myMembership) {
        userStatus = (myMembership.status as any) || "approved";
      }
    }

    const groupContribs = allContributions.filter((c) => c.group_id === g._id && c.status === "paid");
    const groupPayouts = allPayouts.filter((p) => p.group_id === g._id);
    const totalCollected = groupContribs.reduce((sum, c) => sum + c.amount, 0);
    const totalDisbursed = groupPayouts.reduce((sum, p) => sum + p.gross_amount, 0);
    const poolBalance = Math.max(0, totalCollected - totalDisbursed);

    return {
      ...g,
      approved_members_count: approvedCount,
      pending_members_count: pendingCount,
      user_status: userStatus,
      available_pool: poolBalance,
    };
  });

  // Calculate detailed data for primary/active group
  const activeGroupId = req.nextUrl.searchParams.get("groupId") || primaryGroup._id;
  const selectedGroup = allGroups.find((g) => g._id === activeGroupId) || primaryGroup;
  const selectedMemberships = allMemberships.filter((gm) => gm.group_id === selectedGroup._id);

  const groupUsers = allUsers.filter((u) =>
    selectedMemberships.some((gm) => gm.user_id === u._id && gm.status !== "rejected")
  );

  const selectedContribs = allContributions.filter((c) => c.group_id === selectedGroup._id);
  const selectedPayouts = allPayouts.filter((p) => p.group_id === selectedGroup._id);

  const members = groupUsers.map((u) => {
    const contribution = selectedContribs.find(
      (c) =>
        c.user_id === u._id &&
        c.cycle_month === selectedGroup.current_cycle_month &&
        c.status === "paid"
    );

    const membership = selectedMemberships.find((gm) => gm.user_id === u._id);

    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      mobile: u.mobile,
      dob: u.dob,
      aadhaar_last4: u.aadhaar_last4,
      pan: u.pan,
      bank_details: u.bank_details,
      membership_status: membership?.status || "approved",
      payment_status: contribution ? "paid" : "pending",
      paid_amount: contribution ? contribution.amount : 0,
      paid_at: contribution?.paid_at,
      has_received_payout: membership?.has_received_payout || false,
    };
  });

  const totalCollected = selectedContribs
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalDisbursed = selectedPayouts.reduce((sum, p) => sum + p.gross_amount, 0);
  const availablePoolBalance = Math.max(0, totalCollected - totalDisbursed);

  return NextResponse.json({
    group: selectedGroup,
    groups: formattedGroups,
    members,
    total_members: members.length,
    paid_members_count: members.filter((m) => m.payment_status === "paid").length,
    pending_members_count: members.filter((m) => m.payment_status === "pending").length,
    total_collected_lifetime: totalCollected,
    total_disbursed_lifetime: totalDisbursed,
    available_pool_balance: availablePoolBalance,
    monthly_target: members.length * selectedGroup.monthly_amount,
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || (session.role !== "founder" && session.role !== "admin")) {
    return NextResponse.json({ error: "केवल मुख्य फाउंडर या एडमिन ही नया ग्रुप खोल सकते हैं।" }, { status: 403 });
  }

  try {
    const { name, monthly_amount, due_date_day, total_cycle_months, max_members, description } = await req.json();

    const cleanName = sanitize(name) || "BBCC Fund Grup";
    const amountNum = Math.max(100, Number(monthly_amount) || 5000);
    const dueDayNum = Math.min(28, Math.max(1, Number(due_date_day) || 5));
    const durationNum = Math.max(1, Number(total_cycle_months) || 12);
    const maxMembersNum = Math.max(2, Number(max_members) || 12);
    const cleanDesc = sanitize(description || `${durationNum} माह का बचत फंड, ₹${amountNum} मासिक अंशदान।`);

    const newGroup: FundGroup = {
      _id: `grp_${Date.now()}`,
      name: cleanName,
      monthly_amount: amountNum,
      due_date_day: dueDayNum,
      total_cycle_months: durationNum,
      current_cycle_month: 1,
      max_members: maxMembersNum,
      description: cleanDesc,
      status: "active",
      created_by: session.userId,
      created_at: new Date().toISOString(),
    };

    await dbInsertGroup(newGroup);

    // Enroll creator/admin automatically as approved member
    await dbInsertGroupMember({
      _id: `gm_${Date.now()}`,
      group_id: newGroup._id,
      user_id: session.userId,
      joined_at: new Date().toISOString(),
      status: "approved",
      has_received_payout: false,
    });

    return NextResponse.json({
      success: true,
      group: newGroup,
      message: `फंड ग्रुप '${cleanName}' सफलतापूर्वक बनाया गया! सदस्य अब इसमें जुड़ने के लिए आवेदन कर सकते हैं।`,
    });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json({ error: "ग्रुप बनाने में त्रुटि हुई।" }, { status: 500 });
  }
}
