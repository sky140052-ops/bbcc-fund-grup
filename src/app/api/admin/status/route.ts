import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getOrCreateAdmin } from "../../../../lib/auth";
import { getEmailServiceStatus, sendOtpEmail } from "../../../../lib/email";
import Razorpay from "razorpay";

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

// GET: Returns Admin Profile, Razorpay status, Email status, Astra DB status
export async function GET(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const founderEmail = (process.env.FOUNDER_EMAIL || "sky140052@gmail.com").trim().toLowerCase();
  const admin = await getOrCreateAdmin(founderEmail);

  // 1. Razorpay Check
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const isRazorpayConfigured = Boolean(
    razorpayKeyId &&
      razorpayKeySecret &&
      !razorpayKeyId.includes("placeholder") &&
      !razorpayKeySecret.includes("placeholder")
  );

  const razorpayMode = razorpayKeyId.startsWith("rzp_live")
    ? "Live Mode (सक्रिय)"
    : razorpayKeyId.startsWith("rzp_test")
    ? "Test Mode (परीक्षण)"
    : isRazorpayConfigured
    ? "Configured"
    : "Not Connected (असक्रिय)";

  const maskedKeyId = razorpayKeyId
    ? `${razorpayKeyId.slice(0, 8)}...${razorpayKeyId.slice(-4)}`
    : "Not Configured";

  // 2. Email Service Check
  const emailStatus = await getEmailServiceStatus();

  // 3. Astra DB Check
  const astraEndpoint = process.env.ASTRA_DB_API_ENDPOINT || "";
  const astraToken = process.env.ASTRA_DB_APPLICATION_TOKEN || "";
  const astraKeyspace = process.env.ASTRA_DB_KEYSPACE || "default_keyspace";
  const isAstraConnected = Boolean(
    astraEndpoint && astraToken && !astraEndpoint.includes("placeholder")
  );

  return NextResponse.json({
    success: true,
    admin: {
      name: admin.name || "DFI मुख्य एडमिन",
      email: founderEmail,
      role: "Master Administrator",
      mobile: admin.mobile || "9999999999",
      created_at: admin.created_at,
    },
    razorpay: {
      connected: isRazorpayConfigured,
      key_id_masked: maskedKeyId,
      mode: razorpayMode,
      has_secret: Boolean(razorpayKeySecret),
    },
    email: {
      connected: emailStatus.connected,
      provider: emailStatus.provider,
      details: emailStatus.details,
    },
    database: {
      connected: isAstraConnected,
      keyspace: astraKeyspace,
      provider: "DataStax Astra DB (Serverless Cassandra)",
    },
  });
}

// POST: Trigger diagnostics (Test Email OTP or Test Razorpay API)
export async function POST(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body.action;
    const founderEmail = (process.env.FOUNDER_EMAIL || "sky140052@gmail.com").trim().toLowerCase();
    const targetEmail = (body.to_email || founderEmail).trim().toLowerCase();

    // Action: Test Email
    if (action === "test_email") {
      const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const sendResult = await sendOtpEmail({
        toEmail: targetEmail,
        userName: session.name || "मुख्य एडमिन",
        otp: testOtp,
        purpose: "test",
      });

      if (!sendResult.success) {
        return NextResponse.json(
          {
            error: sendResult.error || "ईमेल भेजने में विफल। कृपया Brevo API Key या ईमेल सेटिंग्स जांचें।",
            provider: sendResult.provider,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `परीक्षण ईमेल ${targetEmail} पर भेजा गया! (Provider: ${sendResult.provider})`,
        provider: sendResult.provider,
        test_otp: testOtp,
      });
    }

    // Action: Test Razorpay
    if (action === "test_razorpay") {
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!razorpayKeyId || !razorpayKeySecret) {
        return NextResponse.json(
          { error: "Razorpay Key ID या Secret सेट नहीं है।" },
          { status: 400 }
        );
      }

      try {
        const instance = new Razorpay({
          key_id: razorpayKeyId,
          key_secret: razorpayKeySecret,
        });

        // Ping Razorpay orders API to test credentials
        const orders = await instance.orders.all({ count: 1 });
        return NextResponse.json({
          success: true,
          message: "🟢 Razorpay API सफलता से कनेक्ट हो गई है! क्रेडेंशियल 100% सही हैं।",
          orders_count: orders?.items?.length || 0,
        });
      } catch (rzpErr: any) {
        return NextResponse.json(
          {
            error: "Razorpay कनेक्शन में त्रुटि: " + (rzpErr?.error?.description || rzpErr?.message || "Invalid Key/Secret"),
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "अमान्य एक्शन।" }, { status: 400 });
  } catch (err: any) {
    console.error("Diagnostics error:", err);
    return NextResponse.json({ error: "जांच में त्रुटि हुई।" }, { status: 500 });
  }
}
