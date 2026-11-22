import jwt from "jsonwebtoken";
import {
  dbFindUser,
  dbInsertUser,
  dbUpdateUser,
  dbFindMemberByEmail,
  dbUpdateMember,
} from "./astra";
import { hashAadhaar, sanitize } from "./crypto";
import { User, Member, SessionPayload } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "bbcc_fund_secure_jwt_secret_render_production_key";

export function signToken(payload: SessionPayload, rememberMe: boolean = true): string {
  // 30 days token expiry so session stays permanently logged in until logout
  const expiry = "30d";
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiry });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

// Get or initialize Super Admin based purely on FOUNDER_EMAIL environment variable
export async function getOrCreateAdmin(email: string): Promise<User> {
  const envFounderEmail = (process.env.FOUNDER_EMAIL || "sky140052@gmail.com").trim().toLowerCase();
  const envFounderAadhaar = (process.env.FOUNDER_AADHAAR || "000000000000").trim().replace(/\s+/g, "");

  let founder = await dbFindUser({ role: "founder" });
  if (!founder && envFounderEmail) {
    founder = await dbFindUser({ email: envFounderEmail });
  }

  if (!founder) {
    const hashedAadhaar = hashAadhaar(envFounderAadhaar);

    founder = {
      _id: `founder_${Date.now()}`,
      name: "DFI मुख्य एडमिन",
      email: envFounderEmail || email,
      mobile: "9999999999",
      role: "admin",
      aadhaar_last4: envFounderAadhaar.slice(-4),
      aadhaar_hash: hashedAadhaar,
      pan: "ADMIN00000",
      created_at: new Date().toISOString(),
    };

    await dbInsertUser(founder);
  } else if (founder.email !== envFounderEmail) {
    founder.email = envFounderEmail;
    await dbUpdateUser(founder._id, { email: envFounderEmail });
  }

  return founder;
}

// Pure Email + OTP Verifier: Identifies Admin vs Member
export async function verifyUserOtp(email: string, otp: string): Promise<SessionPayload | null> {
  const cleanEmail = sanitize(email).trim().toLowerCase();
  const cleanOtp = sanitize(otp).trim();

  if (!cleanEmail || !cleanOtp) {
    return null;
  }

  const envFounderEmail = (process.env.FOUNDER_EMAIL || "sky140052@gmail.com").trim().toLowerCase();
  const isAdmin = Boolean(envFounderEmail && cleanEmail === envFounderEmail);

  // 1. Check Admin
  if (isAdmin) {
    const adminUser = await getOrCreateAdmin(cleanEmail);
    const storedOtp = adminUser.otp_code?.trim();
    const expiresAt = adminUser.otp_expires_at ? new Date(adminUser.otp_expires_at).getTime() : 0;
    const isExpired = Date.now() > expiresAt;

    if (storedOtp && storedOtp === cleanOtp && !isExpired) {
      await dbUpdateUser(adminUser._id, { otp_code: "", otp_expires_at: "" });
      return {
        userId: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: "admin",
        mobile: adminUser.mobile,
      };
    }
    return null;
  }

  // 2. Check Member
  const member = await dbFindMemberByEmail(cleanEmail);
  if (member) {
    const storedOtp = member.otp_code?.trim();
    const expiresAt = member.otp_expires_at ? new Date(member.otp_expires_at).getTime() : 0;
    const isExpired = Date.now() > expiresAt;

    if (storedOtp && storedOtp === cleanOtp && !isExpired) {
      await dbUpdateMember(member._id, { otp_code: "", otp_expires_at: "" });
      return {
        userId: member._id,
        name: member.name,
        email: member.email,
        role: "member",
        mobile: member.mobile,
        aadhaar: member.aadhaar_number?.slice(-4),
      };
    }
    return null;
  }

  // 3. Fallback: Check legacy users
  const user = await dbFindUser({ email: cleanEmail });
  if (user) {
    const storedOtp = user.otp_code?.trim();
    const expiresAt = user.otp_expires_at ? new Date(user.otp_expires_at).getTime() : 0;
    const isExpired = Date.now() > expiresAt;

    if (storedOtp && storedOtp === cleanOtp && !isExpired) {
      await dbUpdateUser(user._id, { otp_code: "", otp_expires_at: "" });
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role === "founder" || user.role === "admin" ? "admin" : "member",
        mobile: user.mobile,
      };
    }
  }

  return null;
}
