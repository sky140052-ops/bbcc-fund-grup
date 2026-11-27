import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../../lib/auth";
import {
  dbFindMembers,
  dbFindContributions,
  dbFindLoans,
  dbFindUsers,
  dbGetSystemSettings,
} from "../../../../../lib/astra";

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

export async function GET(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "अनधिकृत अनुरोध। केवल एडमिन ही डेटा बैकअप एक्सपोर्ट कर सकते हैं।" },
      { status: 401 }
    );
  }

  try {
    const [members, contributions, loans, users, settings] = await Promise.all([
      dbFindMembers(),
      dbFindContributions(),
      dbFindLoans(),
      dbFindUsers(),
      dbGetSystemSettings(),
    ]);

    const timestamp = new Date().toISOString();
    const backupData = {
      backup_title: "DFI Emergency Seva Group - Full Database Backup (Fresh Launch Archive)",
      exported_at: timestamp,
      exported_by: {
        id: session.userId,
        name: session.name,
        role: session.role,
      },
      summary: {
        total_members: members.length,
        total_contributions: contributions.length,
        total_loans: loans.length,
        total_users: users.length,
        total_fund_collected: contributions
          .filter((c) => c.status === "paid")
          .reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
      },
      settings_snapshot: {
        monthly_contribution_amount: settings.monthly_contribution_amount || 100,
        platform_fee: settings.platform_fee !== undefined ? settings.platform_fee : 3,
        admin_upi_id: settings.admin_upi_id,
        admin_upi_name: settings.admin_upi_name,
        admin_bank_name: settings.admin_bank_name,
        admin_account_number: settings.admin_account_number,
        admin_ifsc: settings.admin_ifsc,
        admin_account_holder: settings.admin_account_holder,
        registration_link_active: settings.registration_link_active,
        allow_deposit_after_10th: settings.allow_deposit_after_10th,
        allow_loan_repay_after_15th: settings.allow_loan_repay_after_15th,
      },
      data: {
        members,
        contributions,
        loans,
        users,
      },
    };

    const fileName = `dfi_backup_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    console.error("Error generating backup export:", err);
    return NextResponse.json(
      { error: err.message || "बैकअप फ़ाइल तैयार करने में विफल।" },
      { status: 500 }
    );
  }
}
