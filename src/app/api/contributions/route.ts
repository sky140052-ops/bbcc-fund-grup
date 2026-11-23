import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";
import {
  dbFindContributions,
  dbInsertContribution,
  dbUpdateContribution,
  dbFindContributionById,
  dbFindMemberById,
  dbGetSystemSettings,
} from "../../../lib/astra";
import { sanitize } from "../../../lib/crypto";
import { Contribution } from "../../../lib/types";
import { sendDepositNotificationEmail } from "../../../lib/email";

// GET: Returns list of contributions, community total, and member's total
// Includes 24-hour Auto-Approval check for all pending screenshot contributions
export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const memberId = url.searchParams.get("member_id");

    const allContributions = await dbFindContributions();

    // 24-Hour Auto-Approval Engine
    // If admin has not approved/rejected a pending deposit within 24 hours, auto-approve it!
    const now = Date.now();
    for (const c of allContributions) {
      if (c.status === "pending") {
        const submittedTime = new Date(c.submitted_at || c.paid_at).getTime();
        if (now - submittedTime >= 24 * 60 * 60 * 1000) {
          c.status = "paid";
          c.auto_approved = true;
          c.approved_at = new Date(submittedTime + 24 * 60 * 60 * 1000).toISOString();
          await dbUpdateContribution(c._id, {
            status: "paid",
            auto_approved: true,
            approved_at: c.approved_at,
          });
          // Send Auto-Approval Email to Member
          dbFindMemberById(c.member_id).then((m) => {
            if (m?.email) {
              sendDepositNotificationEmail({
                type: "approved",
                memberName: c.member_name,
                memberEmail: m.email,
                amount: c.amount,
                month: c.month,
              }).catch(console.warn);
            }
          }).catch(console.warn);
        }
      }
    }

    // Sort newest first
    allContributions.sort((a, b) => new Date(b.paid_at || b.submitted_at || 0).getTime() - new Date(a.paid_at || a.submitted_at || 0).getTime());

    // Calculate community total (only approved / paid contributions)
    const totalCommunityPool = allContributions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    // Calculate member's total
    const targetMemberId = memberId || (session.role === "member" ? session.userId : null);
    const memberContributions = targetMemberId
      ? allContributions.filter((c) => (c.member_id === targetMemberId || (c as any).user_id === targetMemberId))
      : [];

    const memberTotalDeposited = memberContributions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    return NextResponse.json({
      success: true,
      contributions: allContributions,
      total_community_pool: totalCommunityPool,
      member_total_deposited: memberTotalDeposited,
      member_contributions: memberContributions,
    });
  } catch (err: any) {
    console.error("Contributions GET error:", err);
    return NextResponse.json({ error: "जमा सूची लोड करने में विफल।" }, { status: 500 });
  }
}

// POST: Save Direct UPI Screenshot Deposit (Auto-approves in 24h if admin does not act)
export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check monthly deposit window (1st to 10th of month, or admin override)
    const currentDay = new Date().getDate();
    const settings = await dbGetSystemSettings();
    const isDepositAllowed = (currentDay >= 1 && currentDay <= 10) || settings.allow_deposit_after_10th || session.role === "admin";
    if (!isDepositAllowed) {
      return NextResponse.json(
        { error: "इस माह की निर्धारित जमा अवधि (1-10 तारीख) समाप्त हो चुकी है। 10 तारीख के बाद जमा बंद है।" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const configuredAmount = settings.monthly_contribution_amount || 100;
    const platformFee = settings.platform_fee !== undefined ? settings.platform_fee : 3;
    const amount = (session.role === "admin" || session.role === "founder") && body.amount
      ? Math.max(1, Number(body.amount))
      : configuredAmount;
    const totalPaid = amount + platformFee;
    const targetMemberId = body.member_id || session.userId;
    const targetMemberName = body.member_name || session.name;
    const targetMemberMobile = body.member_mobile || session.mobile || "";

    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
    const targetMonth = body.month || currentMonth;
    const screenshot = body.payment_screenshot || "";

    // Check duplicate: Only one deposit per month.
    // If pending: block duplicate upload!
    // If paid: block duplicate upload!
    // If rejected: allow re-upload (update or insert).
    const allContributions = await dbFindContributions();
    const existingContribution = allContributions.find(
      (c) => (c.member_id === targetMemberId || (c as any).user_id === targetMemberId) && c.month === targetMonth
    );

    if (existingContribution) {
      if (existingContribution.status === "paid") {
        return NextResponse.json(
          { error: `माह ${targetMonth} का ₹${existingContribution.amount} अंशदान पहले से स्वीकृत (Paid) है। दोबारा जमा करने की आवश्यकता नहीं है।` },
          { status: 400 }
        );
      }
      if (existingContribution.status === "pending") {
        return NextResponse.json(
          { error: `माह ${targetMonth} का स्क्रीनशॉट पहले से जमा है और समीक्षाधीन है (24 घंटे में स्वतः स्वीकृत हो जाएगा)। दोबारा अपलोड नहीं कर सकते।` },
          { status: 400 }
        );
      }
    }

    // If submitted by Admin directly, it is marked 'paid' immediately
    // If submitted by Member, it is marked 'pending' and auto-approved in 24 hours
    const isAdmin = session.role === "admin" || session.role === "founder";
    const initialStatus = isAdmin ? "paid" : "pending";

    let contributionRecord: Contribution;

    if (existingContribution && existingContribution.status === "rejected") {
      // Re-uploading after rejection: update existing record
      await dbUpdateContribution(existingContribution._id, {
        amount,
        platform_fee: platformFee,
        total_paid: totalPaid,
        status: initialStatus,
        payment_screenshot: screenshot,
        submitted_at: new Date().toISOString(),
        auto_approved: false,
        rejection_reason: undefined,
        note: sanitize(body.note || "DFI मासिक अंशदान जमा (Direct UPI - Re-submitted)"),
      });
      contributionRecord = {
        ...existingContribution,
        amount,
        platform_fee: platformFee,
        total_paid: totalPaid,
        status: initialStatus,
        payment_screenshot: screenshot,
        submitted_at: new Date().toISOString(),
        auto_approved: false,
      };
    } else {
      const newContribution: Contribution = {
        _id: `cntr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        member_id: targetMemberId,
        member_name: targetMemberName,
        member_mobile: targetMemberMobile,
        amount,
        platform_fee: platformFee,
        total_paid: totalPaid,
        month: targetMonth,
        status: initialStatus,
        payment_screenshot: screenshot,
        submitted_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
        auto_approved: false,
        note: sanitize(body.note || "DFI मासिक अंशदान जमा (Direct UPI)"),
      };

      await dbInsertContribution(newContribution);
      contributionRecord = newContribution;
    }

    // Trigger Email Notification to Admin & Member
    const memberObj = await dbFindMemberById(targetMemberId);
    sendDepositNotificationEmail({
      type: initialStatus === "paid" ? "approved" : "pending",
      memberName: targetMemberName,
      memberEmail: memberObj?.email,
      amount,
      month: targetMonth,
      screenshotUrl: screenshot,
    }).catch(console.warn);

    const message = isAdmin
      ? `₹${amount} की राशि सफलतापूर्वक दर्ज कर दी गई!`
      : `₹${amount} का स्क्रीनशॉट दर्ज हो गया है! एडमिन द्वारा तुरंत या 24 घंटे में स्वतः (Auto-Approve) आपके खाते में जुड़ जाएगा।`;

    return NextResponse.json({
      success: true,
      message,
      contribution: contributionRecord,
    });
  } catch (err: any) {
    console.error("Contribution POST error:", err);
    return NextResponse.json({ error: "जमा राशि सुरक्षित करने में त्रुटि।" }, { status: 500 });
  }
}

// PUT: Admin Manual Approval or Rejection
export async function PUT(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || (session.role !== "admin" && session.role !== "founder")) {
    return NextResponse.json({ error: "अनधिकृत अनुरोध। केवल एडमिन ही यह बदलाव कर सकते हैं।" }, { status: 401 });
  }

  try {
    const { contribution_id, action, reason } = await req.json();
    if (!contribution_id) {
      return NextResponse.json({ error: "कंट्रीब्यूशन आईडी आवश्यक है।" }, { status: 400 });
    }

    const contribution = await dbFindContributionById(contribution_id);
    if (!contribution) {
      return NextResponse.json({ error: "जमा रिकॉर्ड नहीं मिला।" }, { status: 404 });
    }

    const memberObj = await dbFindMemberById(contribution.member_id);

    if (action === "approve") {
      await dbUpdateContribution(contribution_id, {
        status: "paid",
        approved_at: new Date().toISOString(),
        auto_approved: false,
      });

      sendDepositNotificationEmail({
        type: "approved",
        memberName: contribution.member_name,
        memberEmail: memberObj?.email,
        amount: contribution.amount,
        month: contribution.month,
      }).catch(console.warn);

      return NextResponse.json({
        success: true,
        message: `सदस्य '${contribution.member_name}' का ₹${contribution.amount} का अंशदान सफलतापूर्वक स्वीकार कर लिया गया!`,
      });
    } else if (action === "reject") {
      const cleanReason = sanitize(reason || "अमान्य या अपूर्ण स्क्रीनशॉट");
      await dbUpdateContribution(contribution_id, {
        status: "rejected",
        rejection_reason: cleanReason,
      });

      sendDepositNotificationEmail({
        type: "rejected",
        memberName: contribution.member_name,
        memberEmail: memberObj?.email,
        amount: contribution.amount,
        month: contribution.month,
        rejectionReason: cleanReason,
      }).catch(console.warn);

      return NextResponse.json({
        success: true,
        message: `सदस्य '${contribution.member_name}' का जमा अनुरोध अस्वीकार कर दिया गया।`,
      });
    }

    return NextResponse.json({ error: "अमान्य एक्शन।" }, { status: 400 });
  } catch (err: any) {
    console.error("Contribution PUT error:", err);
    return NextResponse.json({ error: "सत्यापन प्रक्रिया में त्रुटि।" }, { status: 500 });
  }
}
