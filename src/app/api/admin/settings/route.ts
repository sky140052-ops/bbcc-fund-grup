import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import { dbGetSystemSettings, dbUpdateSystemSettings } from "../../../../lib/astra";

function getAdminSession(req: NextRequest) {
  let token = req.cookies.get("bbcc_session")?.value;
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }
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
    const monthlyAmount = settings.monthly_contribution_amount || 100;
    const platformFee = settings.platform_fee !== undefined ? settings.platform_fee : 3;
    const totalMonthlyPayable = monthlyAmount + platformFee;

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        monthly_contribution_amount: monthlyAmount,
        platform_fee: platformFee,
        google_client_id: settings.google_client_id || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "",
      },
      total_monthly_payable: totalMonthlyPayable,
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
    if (body.monthly_contribution_amount !== undefined) {
      const amt = Number(body.monthly_contribution_amount);
      if (!isNaN(amt) && amt >= 1) {
        updates.monthly_contribution_amount = Math.round(amt);
      }
    }
    if (body.platform_fee !== undefined) {
      const fee = Number(body.platform_fee);
      if (!isNaN(fee) && fee >= 0) {
        updates.platform_fee = Math.round(fee);
      }
    }
    if (body.admin_upi_id !== undefined) {
      updates.admin_upi_id = String(body.admin_upi_id).trim();
    }
    if (body.admin_upi_name !== undefined) {
      updates.admin_upi_name = String(body.admin_upi_name).trim();
    }
    if (body.admin_qr_code !== undefined) {
      updates.admin_qr_code = String(body.admin_qr_code).trim();
    }
    if (body.admin_bank_name !== undefined) {
      updates.admin_bank_name = String(body.admin_bank_name).trim();
    }
    if (body.admin_account_number !== undefined) {
      updates.admin_account_number = String(body.admin_account_number).trim();
    }
    if (body.admin_ifsc !== undefined) {
      updates.admin_ifsc = String(body.admin_ifsc).trim().toUpperCase();
    }
    if (body.admin_account_holder !== undefined) {
      updates.admin_account_holder = String(body.admin_account_holder).trim();
    }
    if (body.brevo_api_key !== undefined) {
      updates.brevo_api_key = String(body.brevo_api_key).trim();
      process.env.BREVO_API_KEY = updates.brevo_api_key;
    }
    if (body.brevo_sender_email !== undefined) {
      updates.brevo_sender_email = String(body.brevo_sender_email).trim();
      process.env.BREVO_SENDER_EMAIL = updates.brevo_sender_email;
    }
    if (body.google_client_id !== undefined) {
      updates.google_client_id = String(body.google_client_id).trim();
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = updates.google_client_id;
    }
    if (body.smtp_email !== undefined) {
      updates.smtp_email = String(body.smtp_email).trim();
      process.env.SMTP_EMAIL = updates.smtp_email;
    }
    if (body.smtp_password !== undefined) {
      updates.smtp_password = String(body.smtp_password).trim();
      process.env.SMTP_PASSWORD = updates.smtp_password;
    }

    try {
      const fs = await import("fs");
      const path = await import("path");
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf8");
        if (updates.brevo_api_key) {
          if (envContent.includes("BREVO_API_KEY=")) {
            envContent = envContent.replace(/BREVO_API_KEY=.*/g, `BREVO_API_KEY=${updates.brevo_api_key}`);
          } else {
            envContent += `\nBREVO_API_KEY=${updates.brevo_api_key}`;
          }
        }
        if (updates.brevo_sender_email) {
          if (envContent.includes("BREVO_SENDER_EMAIL=")) {
            envContent = envContent.replace(/BREVO_SENDER_EMAIL=.*/g, `BREVO_SENDER_EMAIL=${updates.brevo_sender_email}`);
          } else {
            envContent += `\nBREVO_SENDER_EMAIL=${updates.brevo_sender_email}`;
          }
        }
        fs.writeFileSync(envPath, envContent.trim() + "\n", "utf8");
      }
    } catch (fsErr) {
      console.warn("Could not write to .env.local:", fsErr);
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
