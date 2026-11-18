import { NextRequest, NextResponse } from "next/server";

// Pure Email & OTP Authentication is enabled. Password login is deprecated.
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: "पासवर्ड लॉगिन प्रणाली अब निष्क्रिय है। कृपया सुरक्षित ईमेल व 6-अंकीय OTP से लॉगिन करें।",
      redirectTo: "/login",
    },
    { status: 400 }
  );
}
