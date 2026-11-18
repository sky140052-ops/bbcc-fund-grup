import { NextResponse } from "next/server";

// MD / Manager role has been completely removed. Only Admin and Client roles exist.
export async function GET() {
  return NextResponse.json({ managers: [] });
}

export async function POST() {
  return NextResponse.json(
    { error: "MD/मैनेजर पद अब समाप्त कर दिया गया है। सिस्टम में केवल एडमिन एवं क्लाइंट (सदस्य) ही मान्य हैं।" },
    { status: 400 }
  );
}
