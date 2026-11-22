import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import { dbGetSystemSettings, dbUpdateSystemSettings } from "../../../../lib/astra";

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

// GET: Returns current system settings & current day of month (public / member accessible)
export async function GET() {
  try {
    const settings = await dbGetSystemSettings();
    const currentDay = new Date().getDate(); // 1 to 31
    return NextResponse.json({
      success: true,
      settings,
      currentDay,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "सेटिंग्स लोड करने में विफल।" },
      { status: 500 }
    );
  }
}

// POST / PUT: Update settings (Admin only)
export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

async function handleUpdate(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "अनधिकृत अनुरोध। केवल एडमिन ही यह बदलाव कर सकते हैं।" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const updates: Record<string, any> = {};

    if (typeof body.registration_link_active === "boolean") {
      updates.registration_link_active = body.registration_link_active;
    }
    if (typeof body.allow_deposit_after_10th === "boolean") {
      updates.allow_deposit_after_10th = body.allow_deposit_after_10th;
    }
    if (typeof body.allow_loan_repay_after_15th === "boolean") {
      updates.allow_loan_repay_after_15th = body.allow_loan_repay_after_15th;
    }

    const updatedSettings = await dbUpdateSystemSettings(updates);
    const currentDay = new Date().getDate();

    return NextResponse.json({
      success: true,
      message: "सिस्टम सेटिंग्स सफलतापूर्वक अपडेट हो गई!",
      settings: updatedSettings,
      currentDay,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "सेटिंग्स अपडेट करने में विफल।" },
      { status: 500 }
    );
  }
}
