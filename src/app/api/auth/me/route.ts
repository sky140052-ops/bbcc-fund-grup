import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import { getLocalStore } from "../../../../lib/astra";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const store = getLocalStore();
  const fullUser = store.users.find((u) => u._id === payload.userId);

  return NextResponse.json({
    authenticated: true,
    user: fullUser || payload,
  });
}
