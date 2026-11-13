import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import {
  dbFindAllGroupMembers,
  dbFindUsers,
  dbFindGroups,
} from "../../../../lib/astra";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || (session.role !== "founder" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized. केवल मुख्य एडमिन ही आवेदन देख सकते हैं।" }, { status: 403 });
  }

  const allMemberships = await dbFindAllGroupMembers();
  const allUsers = await dbFindUsers();
  const allGroups = await dbFindGroups();

  const applications = allMemberships.map((gm) => {
    const user = allUsers.find((u) => u._id === gm.user_id);
    const group = allGroups.find((g) => g._id === gm.group_id);

    return {
      _id: gm._id,
      group_id: gm.group_id,
      group_name: group?.name || "अज्ञात ग्रुप",
      monthly_amount: group?.monthly_amount || 0,
      user_id: gm.user_id,
      user_name: user?.name || "अज्ञात सदस्य",
      user_email: user?.email || "—",
      user_mobile: user?.mobile || "—",
      user_dob: user?.dob || "—",
      user_pan: user?.pan || "—",
      user_aadhaar_last4: user?.aadhaar_last4 || "—",
      status: gm.status || "approved",
      joined_at: gm.joined_at,
    };
  });

  return NextResponse.json({
    applications,
    pending_count: applications.filter((a) => a.status === "pending").length,
  });
}
