import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import {
  dbFindMembers,
  dbInsertMember,
  dbUpdateMember,
  dbDeleteMember,
  dbFindMemberById,
  dbCheckDuplicateMember,
} from "../../../../lib/astra";
import { sanitize } from "../../../../lib/crypto";
import { Member } from "../../../../lib/types";

// Helper to check admin auth
function getAdminSession(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  if (!token) return null;
  const session = verifyToken(token);
  if (!session) return null;
  if (session.role === "admin" || session.role === "founder") {
    return session;
  }
  return null;
}

// GET: Fetch all members or search by query
export async function GET(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. केवल एडमिन ही देख सकते हैं।" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const query = (url.searchParams.get("q") || "").trim().toLowerCase();

    let members = await dbFindMembers();

    if (query) {
      members = members.filter((m) => {
        return (
          m.name?.toLowerCase().includes(query) ||
          m.mobile?.includes(query) ||
          m.aadhaar_number?.includes(query) ||
          m.pan_number?.toLowerCase().includes(query) ||
          m.upi_id?.toLowerCase().includes(query) ||
          m.wallet_number?.includes(query)
        );
      });
    }

    // Sort newest first
    members.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      members,
      total: members.length,
    });
  } catch (err: any) {
    console.error("Fetch members error:", err);
    return NextResponse.json({ error: "सदस्य सूची लोड करने में त्रुटि।" }, { status: 500 });
  }
}

// POST: Add new member
export async function POST(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. केवल एडमिन ही सदस्य जोड़ सकते हैं।" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const name = sanitize(body.name || "").trim();
    const email = sanitize(body.email || "").trim().toLowerCase();
    const mobile = sanitize(body.mobile || "").replace(/\D/g, "");

    if (!name) {
      return NextResponse.json({ error: "कृपया सदस्य का नाम दर्ज करें।" }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "कृपया सदस्य का वैध ईमेल (Gmail) आईडी दर्ज करें।" }, { status: 400 });
    }

    if (mobile.length < 10) {
      return NextResponse.json({ error: "कृपया 10-अंकों का वैध मोबाइल नंबर दर्ज करें।" }, { status: 400 });
    }

    const photo = body.photo || "";

    const aadhaar_number = sanitize(body.aadhaar_number || "").replace(/\D/g, "");
    if (aadhaar_number.length !== 12) {
      return NextResponse.json({ error: "कृपया 12-अंकों का आधार कार्ड नंबर दर्ज करें।" }, { status: 400 });
    }

    const aadhaar_file = body.aadhaar_file || "";

    const pan_number = sanitize(body.pan_number || "").toUpperCase().trim();
    if (pan_number && pan_number.length < 10) {
      return NextResponse.json({ error: "कृपया 10-अंकों का वैध पैन कार्ड नंबर दर्ज करें अथवा इसे खाली छोड़ें।" }, { status: 400 });
    }

    const pan_file = body.pan_file || "";

    const upi = sanitize(body.upi_id || "").trim();
    const acc = sanitize(body.account_number || "").trim();
    const ifsc = sanitize(body.ifsc || "").trim();
    const wallet = sanitize(body.wallet_number || "").trim();
    if (!upi && (!acc || !ifsc) && !wallet) {
      return NextResponse.json({ error: "कृपया बैंक खाता/IFSC, UPI आईडी या फोनपे/जीपे वॉलेट नंबर दर्ज करें।" }, { status: 400 });
    }

    const effectiveEmail = email;

    // Strictly check for duplicate members across email, mobile, Aadhaar, and PAN
    const dupCheck = await dbCheckDuplicateMember({
      email: effectiveEmail,
      mobile,
      aadhaar_number,
      pan_number,
    });
    if (dupCheck.isDuplicate) {
      return NextResponse.json({ error: dupCheck.message }, { status: 400 });
    }

    const newMember: Member = {
      _id: `dfi_mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      email: effectiveEmail,
      mobile,
      photo: body.photo || "",
      aadhaar_number,
      aadhaar_file: body.aadhaar_file || "",
      aadhaar_file_type: body.aadhaar_file_type || (body.aadhaar_file?.includes("application/pdf") ? "pdf" : "image"),
      aadhaar_file_name: body.aadhaar_file_name || "aadhaar_doc",
      pan_number,
      pan_file: body.pan_file || "",
      pan_file_type: body.pan_file_type || (body.pan_file?.includes("application/pdf") ? "pdf" : "image"),
      pan_file_name: body.pan_file_name || "pan_doc",
      upi_id: sanitize(body.upi_id || "").trim(),
      account_number: sanitize(body.account_number || "").trim(),
      ifsc: sanitize(body.ifsc || "").toUpperCase().trim(),
      bank_name: sanitize(body.bank_name || "").trim(),
      wallet_number: sanitize(body.wallet_number || "").replace(/\D/g, ""),
      created_at: new Date().toISOString(),
    };

    await dbInsertMember(newMember);

    return NextResponse.json({
      success: true,
      message: `सदस्य ${name} को सफलतापूर्वक जोड़ दिया गया है!`,
      member: newMember,
    });
  } catch (err: any) {
    console.error("Add member error:", err);
    return NextResponse.json({ error: "सदस्य जोड़ने में त्रुटि: " + (err?.message || "Internal error") }, { status: 500 });
  }
}

// PUT: Update existing member
export async function PUT(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. केवल एडमिन ही सदस्य अपडेट कर सकते हैं।" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = body._id || body.id;

    if (!id) {
      return NextResponse.json({ error: "सदस्य ID आवश्यक है।" }, { status: 400 });
    }

    const existing = await dbFindMemberById(id);
    if (!existing) {
      return NextResponse.json({ error: "सदस्य नहीं मिला।" }, { status: 404 });
    }

    const updates: Partial<Member> = {};

    if (body.name !== undefined) updates.name = sanitize(body.name).trim();
    if (body.email !== undefined) updates.email = sanitize(body.email).trim().toLowerCase();
    if (body.mobile !== undefined) updates.mobile = sanitize(body.mobile).replace(/\D/g, "");
    if (body.photo !== undefined) updates.photo = body.photo;
    if (body.aadhaar_number !== undefined) updates.aadhaar_number = sanitize(body.aadhaar_number).replace(/\D/g, "");
    if (body.aadhaar_file !== undefined) {
      updates.aadhaar_file = body.aadhaar_file;
      updates.aadhaar_file_type = body.aadhaar_file_type || (body.aadhaar_file?.includes("application/pdf") ? "pdf" : "image");
      updates.aadhaar_file_name = body.aadhaar_file_name || "aadhaar_doc";
    }
    if (body.pan_number !== undefined) updates.pan_number = sanitize(body.pan_number).toUpperCase().trim();
    if (body.pan_file !== undefined) {
      updates.pan_file = body.pan_file;
      updates.pan_file_type = body.pan_file_type || (body.pan_file?.includes("application/pdf") ? "pdf" : "image");
      updates.pan_file_name = body.pan_file_name || "pan_doc";
    }
    if (body.upi_id !== undefined) updates.upi_id = sanitize(body.upi_id).trim();
    if (body.account_number !== undefined) updates.account_number = sanitize(body.account_number).trim();
    if (body.ifsc !== undefined) updates.ifsc = sanitize(body.ifsc).toUpperCase().trim();
    if (body.bank_name !== undefined) updates.bank_name = sanitize(body.bank_name).trim();
    if (body.wallet_number !== undefined) updates.wallet_number = sanitize(body.wallet_number).replace(/\D/g, "");

    // Strictly check for duplicates on updated fields (excluding this member ID)
    const checkEmail = updates.email || existing.email;
    const checkMobile = updates.mobile || existing.mobile;
    const checkAadhaar = updates.aadhaar_number !== undefined ? updates.aadhaar_number : existing.aadhaar_number;
    const checkPan = updates.pan_number !== undefined ? updates.pan_number : existing.pan_number;

    const dupCheck = await dbCheckDuplicateMember({
      email: checkEmail,
      mobile: checkMobile,
      aadhaar_number: checkAadhaar,
      pan_number: checkPan,
      excludeMemberId: id,
    });
    if (dupCheck.isDuplicate) {
      return NextResponse.json({ error: dupCheck.message }, { status: 400 });
    }

    await dbUpdateMember(id, updates);

    const updated = await dbFindMemberById(id);

    return NextResponse.json({
      success: true,
      message: "सदस्य विवरण सफलतापूर्वक अपडेट कर दिया गया!",
      member: updated,
    });
  } catch (err: any) {
    console.error("Update member error:", err);
    return NextResponse.json({ error: "सदस्य विवरण अपडेट करने में त्रुटि।" }, { status: 500 });
  }
}

// DELETE: Delete member
export async function DELETE(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. केवल एडमिन ही सदस्य हटा सकते हैं।" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    let id = url.searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id || body._id;
    }

    if (!id) {
      return NextResponse.json({ error: "सदस्य ID आवश्यक है।" }, { status: 400 });
    }

    const success = await dbDeleteMember(id);
    if (!success) {
      return NextResponse.json({ error: "सदस्य नहीं मिला या हटाया नहीं जा सका।" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "सदस्य को सफलतापूर्वक हटा दिया गया है।",
    });
  } catch (err: any) {
    console.error("Delete member error:", err);
    return NextResponse.json({ error: "सदस्य हटाने में त्रुटि।" }, { status: 500 });
  }
}
