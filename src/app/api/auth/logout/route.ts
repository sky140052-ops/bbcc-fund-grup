import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  
  // Fully delete session cookie with maxAge 0 & expired date
  response.cookies.delete("bbcc_session");
  response.cookies.set("bbcc_session", "", {
    httpOnly: true,
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
