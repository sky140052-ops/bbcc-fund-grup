import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, signToken } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { identifier, secret } = await req.json();

    if (!identifier || !secret) {
      return NextResponse.json(
        { error: "कृपया मोबाइल नंबर/आधार और जन्मतिथि/पासवर्ड दर्ज करें।" },
        { status: 400 }
      );
    }

    const user = await authenticateUser(identifier, secret);

    if (!user) {
      return NextResponse.json(
        { error: "गलत क्रेडेंशियल्स! कृपया सही जानकारी दर्ज करें।" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user._id,
      name: user.name,
      role: user.role,
      mobile: user.mobile,
      aadhaar: user.aadhaar_last4,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
        aadhaar_last4: user.aadhaar_last4,
      },
      redirectTo: user.role === "member" ? "/dashboard" : "/admin",
    });

    // Set secure HTTP-only session cookie (prevents XSS & CSRF attacks)
    response.cookies.set("bbcc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "लॉगिन करने में त्रुटि हुई।" }, { status: 500 });
  }
}
