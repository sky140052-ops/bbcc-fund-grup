import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import {
  dbFindGroupById,
  dbFindAllGroupMembers,
  dbInsertGroupMember,
} from "../../../../lib/astra";
import { GroupMember } from "../../../../lib/types";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json(
      { error: "ग्रुप में जुड़ने के लिए पहले लॉगिन करें।" },
      { status: 401 }
    );
  }

  try {
    const { group_id } = await req.json();

    if (!group_id) {
      return NextResponse.json({ error: "ग्रुप आईडी अमान्य है।" }, { status: 400 });
    }

    const group = await dbFindGroupById(group_id);
    if (!group) {
      return NextResponse.json({ error: "चयनित फंड ग्रुप उपलब्ध नहीं है।" }, { status: 404 });
    }

    // Check if user has already applied or joined
    const allMemberships = await dbFindAllGroupMembers({ group_id, user_id: session.userId });
    const existing = allMemberships.find(
      (gm) => gm.group_id === group_id && gm.user_id === session.userId
    );

    if (existing) {
      if (existing.status === "approved") {
        return NextResponse.json(
          { error: "आप पहले से ही इस ग्रुप के सक्रिय सदस्य हैं।" },
          { status: 400 }
        );
      }
      if (existing.status === "pending") {
        return NextResponse.json(
          { error: "आपका आवेदन पहले से ही एडमिन के पास समीक्षाधीन (Pending) है।" },
          { status: 400 }
        );
      }
    }

    // Check max members
    const groupMembers = await dbFindAllGroupMembers({ group_id });
    const approvedCount = groupMembers.filter((gm) => gm.status === "approved").length;
    if (group.max_members && approvedCount >= group.max_members) {
      return NextResponse.json(
        { error: "यह ग्रुप पहले ही अधिकतम सदस्यों (फुल) से भर चुका है।" },
        { status: 400 }
      );
    }

    const newMembership: GroupMember = {
      _id: `gm_${Date.now()}`,
      group_id,
      user_id: session.userId,
      joined_at: new Date().toISOString(),
      status: "pending", // Pending approval from Admin!
      has_received_payout: false,
    };

    await dbInsertGroupMember(newMembership);

    return NextResponse.json({
      success: true,
      message: `ग्रुप '${group.name}' में जुड़ने का आवेदन सफलतापूर्वक भेजा गया! मुख्य एडमिन द्वारा अप्रूवल मिलते ही आप मासिक अंशदान जमा कर सकेंगे।`,
    });
  } catch (err) {
    console.error("Join group error:", err);
    return NextResponse.json({ error: "आवेदन दर्ज करने में समस्या आई।" }, { status: 500 });
  }
}
