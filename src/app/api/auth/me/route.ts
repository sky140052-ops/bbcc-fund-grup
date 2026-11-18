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
        email: payload.email,
        role: payload.role,
        mobile: payload.mobile,
      },
    });
  }

  // Security: exclude password_hash and aadhaar_hash from client response
  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    dob: user.dob,
    role: user.role,
    aadhaar_last4: user.aadhaar_last4,
    pan: user.pan,
    father_name: user.father_name,
    gender: user.gender,
    marital_status: user.marital_status,
    address: user.address,
    city: user.city,
    pincode: user.pincode,
    occupation: user.occupation,
    monthly_income: user.monthly_income,
    nominee_name: user.nominee_name,
    nominee_relation: user.nominee_relation,
    nominee_mobile: user.nominee_mobile,
    photo_live: user.photo_live,
    aadhaar_front: user.aadhaar_front,
    aadhaar_back: user.aadhaar_back,
    pan_type: user.pan_type,
    pan_document: user.pan_document,
    epan_password: user.epan_password,
    bank_details: user.bank_details,
    created_at: user.created_at,
  };

  return NextResponse.json({
    authenticated: true,
    user: safeUser,
  });
}
