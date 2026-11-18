import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import { dbFindUsers, dbFindUser, dbUpdateUser, dbDeleteUser } from "../../../../lib/astra";
import { sanitize } from "../../../../lib/crypto";

// GET /api/admin/clients - Search clients by mobile number, name, or email
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("bbcc_session")?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || (session.role !== "admin" && session.role !== "founder")) {
      return NextResponse.json({ error: "अनधिकृत अनुरोध (Admin Only)" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || "").trim().toLowerCase();

    const allUsers = await dbFindUsers();
    // Exclude admin themselves from client list
    const clients = allUsers.filter((u) => u.role !== "founder" && u.role !== "admin");

    if (!query) {
      return NextResponse.json({ clients });
    }

    // Filter by mobile, name, email, or pan
    const filtered = clients.filter((c) => {
      const matchMobile = c.mobile && c.mobile.includes(query);
      const matchName = c.name && c.name.toLowerCase().includes(query);
      const matchEmail = c.email && c.email.toLowerCase().includes(query);
      const matchPan = c.pan && c.pan.toLowerCase().includes(query);
      return matchMobile || matchName || matchEmail || matchPan;
    });

    return NextResponse.json({ clients: filtered });
  } catch (err: any) {
    console.error("Admin clients GET error:", err);
    return NextResponse.json({ error: "क्लाइंट डेटा लोड करने में त्रुटि।" }, { status: 500 });
  }
}

// PUT /api/admin/clients - Edit / Update client details
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("bbcc_session")?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || (session.role !== "admin" && session.role !== "founder")) {
      return NextResponse.json({ error: "अनधिकृत अनुरोध (Admin Only)" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json({ error: "क्लाइंट ID आवश्यक है।" }, { status: 400 });
    }

    const client = await dbFindUser({ _id: userId });
    if (!client) {
      return NextResponse.json({ error: "क्लाइंट नहीं मिला।" }, { status: 404 });
    }

    // Clean and sanitize update fields
    const safeUpdates: Record<string, any> = {};
    if (updates.name) safeUpdates.name = sanitize(updates.name);
    if (updates.mobile) safeUpdates.mobile = sanitize(updates.mobile).replace(/\D/g, "");
    if (updates.dob) safeUpdates.dob = sanitize(updates.dob).replace(/[-/]/g, "");
    if (updates.father_name) safeUpdates.father_name = sanitize(updates.father_name);
    if (updates.address) safeUpdates.address = sanitize(updates.address);
    if (updates.city) safeUpdates.city = sanitize(updates.city);
    if (updates.pincode) safeUpdates.pincode = sanitize(updates.pincode);
    if (updates.occupation) safeUpdates.occupation = sanitize(updates.occupation);
    if (updates.monthly_income) safeUpdates.monthly_income = sanitize(updates.monthly_income);
    if (updates.nominee_name) safeUpdates.nominee_name = sanitize(updates.nominee_name);
    if (updates.nominee_relation) safeUpdates.nominee_relation = sanitize(updates.nominee_relation);
    if (updates.nominee_mobile) safeUpdates.nominee_mobile = sanitize(updates.nominee_mobile);
    if (updates.pan) safeUpdates.pan = sanitize(updates.pan).toUpperCase();
    if (updates.bank_details) safeUpdates.bank_details = updates.bank_details;

    await dbUpdateUser(userId, safeUpdates);

    return NextResponse.json({
      success: true,
      message: `${safeUpdates.name || client.name} का विवरण सफलतापूर्वक अपडेट कर दिया गया।`,
    });
  } catch (err: any) {
    console.error("Admin client update error:", err);
    return NextResponse.json({ error: "क्लाइंट अपडेट करने में त्रुटि हुई।" }, { status: 500 });
  }
}

// DELETE /api/admin/clients - Delete client
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("bbcc_session")?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || (session.role !== "admin" && session.role !== "founder")) {
      return NextResponse.json({ error: "अनधिकृत अनुरोध (Admin Only)" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "क्लाइंट ID आवश्यक है।" }, { status: 400 });
    }

    const client = await dbFindUser({ _id: userId });
    if (!client) {
      return NextResponse.json({ error: "क्लाइंट नहीं मिला।" }, { status: 404 });
    }

    await dbDeleteUser(userId);

    return NextResponse.json({
      success: true,
      message: `क्लाइंट ${client.name} (${client.mobile}) का डेटा सफलतापूर्वक डिलीट कर दिया गया।`,
    });
  } catch (err: any) {
    console.error("Admin client delete error:", err);
    return NextResponse.json({ error: "क्लाइंट डिलीट करने में त्रुटि हुई।" }, { status: 500 });
  }
}
