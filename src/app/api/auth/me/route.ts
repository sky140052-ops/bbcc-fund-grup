import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import { dbFindUser, dbFindMemberById, dbFindMemberByEmail } from "../../../../lib/astra";

export async function GET(req: NextRequest) {
  let token = req.cookies.get("bbcc_session")?.value;
  let fromBearer = false;

  // Support Authorization: Bearer fallback for mobile PWA standalone localStorage
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
      fromBearer = true;
    }
  }

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Helper to attach 10-year persistent cookie if recovered from Bearer
  const attachCookie = (res: NextResponse) => {
    if (fromBearer && token) {
      const PERMANENT_SESSION_SEC = 10 * 365 * 24 * 60 * 60;
      res.cookies.set("bbcc_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: PERMANENT_SESSION_SEC,
        expires: new Date(Date.now() + PERMANENT_SESSION_SEC * 1000),
        path: "/",
      });
    }
    return res;
  };

  // Master Admin & Founder Check
  if (payload.role === "admin" || payload.role === "founder") {
    const user = await dbFindUser({ _id: payload.userId });
    return attachCookie(
      NextResponse.json({
        authenticated: true,
        user: {
          _id: payload.userId,
          name: user?.name || payload.name || "DFI मुख्य एडमिन",
          email: payload.email,
          role: "admin",
          mobile: user?.mobile || payload.mobile,
        },
      })
    );
  }

  // Check if member
  let member = await dbFindMemberById(payload.userId);
  if (!member && payload.email) {
    member = await dbFindMemberByEmail(payload.email);
  }

  if (member) {
    return attachCookie(
      NextResponse.json({
        authenticated: true,
        user: {
          _id: member._id,
          name: member.name,
          email: member.email,
          mobile: member.mobile,
          photo: member.photo,
          aadhaar_number: member.aadhaar_number,
          aadhaar_file: member.aadhaar_file,
          aadhaar_file_type: member.aadhaar_file_type,
          aadhaar_file_name: member.aadhaar_file_name,
          pan_number: member.pan_number,
          pan_file: member.pan_file,
          pan_file_type: member.pan_file_type,
          pan_file_name: member.pan_file_name,
          upi_id: member.upi_id,
          account_number: member.account_number,
          ifsc: member.ifsc,
          bank_name: member.bank_name,
          wallet_number: member.wallet_number,
          role: "member",
          created_at: member.created_at,
        },
      })
    );
  }

  // Fallback to user / admin
  const user = await dbFindUser({ _id: payload.userId });

  return attachCookie(
    NextResponse.json({
      authenticated: true,
      user: {
        _id: payload.userId,
        name: user?.name || payload.name,
        email: payload.email,
        role: payload.role,
        mobile: user?.mobile || payload.mobile,
      },
    })
  );
}
