import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";
import { getLocalStore } from "../../../lib/astra";
import { Vote } from "../../../lib/types";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { request_id } = await req.json();

    if (!request_id) {
      return NextResponse.json({ error: "रिक्वेस्ट आईडी आवश्यक है।" }, { status: 400 });
    }

    const store = getLocalStore();
    const candidateRequest = store.withdrawal_requests.find((r) => r._id === request_id);

    if (!candidateRequest) {
      return NextResponse.json({ error: "रिक्वेस्ट नहीं मिली।" }, { status: 404 });
    }

    // Rule: Cannot vote for self
    if (candidateRequest.user_id === session.userId) {
      return NextResponse.json({ error: "आप स्वयं की रिक्वेस्ट पर वोट नहीं कर सकते।" }, { status: 400 });
    }

    // Rule: 1 vote per member per cycle
    const alreadyVoted = store.votes.some(
      (v) =>
        v.group_id === candidateRequest.group_id &&
        v.cycle_month === candidateRequest.cycle_month &&
        v.voter_user_id === session.userId
    );

    if (alreadyVoted) {
      return NextResponse.json(
        { error: "आप इस महीने का अपना 1 वोट पहले ही डाल चुके हैं।" },
        { status: 400 }
      );
    }

    const newVote: Vote = {
      _id: `vote_${Date.now()}`,
      group_id: candidateRequest.group_id,
      cycle_month: candidateRequest.cycle_month,
      voter_user_id: session.userId,
      candidate_request_id: request_id,
      voted_at: new Date().toISOString(),
    };

    store.votes.push(newVote);
    candidateRequest.votes_count += 1;

    return NextResponse.json({
      success: true,
      message: `आपका वोट ${candidateRequest.user_name} को सफलतापूर्वक दर्ज हुआ!`,
      votes_count: candidateRequest.votes_count,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "वोट दर्ज करने में त्रुटि हुई।" }, { status: 500 });
  }
}
