import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, signToken } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { identifier, secret, remember_me } = await req.json();

    if (!identifier || !secret) {
      return NextResponse.json(
        { error: "कृपया ईमेल (Gmail) और पासवर्ड दर्ज करें।" },
        { status: 400 }
      );
    }

    const user = await authenticateUser(identifier, secret);

    if (!user) {
      return NextResponse.json(
        { error: "गलत ईमेल या पासवर्ड! कृपया सही विवरण दर्ज करें या पासवर्ड रीसेट करें।" },
        { status: 401 }
      );
    }

    const isRememberMe = Boolean(remember_me);
    const maxAgeSeconds = isRememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days if remember me

    const token = signToken(
      {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        aadhaar: user.aadhaar_last4,
      },
      isRememberMe
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        aadhaar_last4: user.aadhaar_last4,
      },
      redirectTo: user.role === "member" ? "/dashboard" : "/admin",
      message: isRememberMe ? "लॉगिन सफल (30 दिनों तक याद रखा जाएगा)" : "लॉगिन सफल",
    });

    response.cookies.set("bbcc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "लॉगिन करने में त्रुटि हुई।" }, { status: 500 });
  }
}
