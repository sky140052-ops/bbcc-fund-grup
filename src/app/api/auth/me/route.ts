import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import { dbFindUser } from "../../../../lib/astra";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = await dbFindUser({ _id: payload.userId });

  if (!user) {
    return NextResponse.json({
      authenticated: true,
      user: {
        _id: payload.userId,
        name: payload.name,
        role: payload.role,
        mobile: payload.mobile,
      },
    });
  }

  // Security: exclude password_hash and aadhaar_hash from client response
  const safeUser = {
    _id: user._id,
    name: user.name,
    mobile: user.mobile,
    dob: user.dob,
    role: user.role,
    aadhaar_last4: user.aadhaar_last4,
    pan: user.pan,
    bank_details: user.bank_details,
    created_at: user.created_at,
  };

  return NextResponse.json({
    authenticated: true,
    user: safeUser,
  });
}
