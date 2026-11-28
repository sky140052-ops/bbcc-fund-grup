import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "मोबाइल SMS OTP सेवा हटा दी गई है। कृपया ईमेल OTP अथवा Google 1-Tap का उपयोग करें।",
      success: false,
    },
    { status: 410 }
  );
}
