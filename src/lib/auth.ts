import jwt from "jsonwebtoken";
import {
  dbFindUser,
  dbInsertUser,
  dbUpdateUser,
  dbGetActiveGroup,
  dbInsertGroup,
  dbInsertGroupMember,
  dbFindGroupMembers,
} from "./astra";
import { hashAadhaar, hashPassword, verifyPassword, sanitize } from "./crypto";
import { User, SessionPayload } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "bbcc_fund_secure_jwt_secret_render_production_key";

export function signToken(payload: SessionPayload, rememberMe: boolean = false): string {
  const expiry = rememberMe ? "30d" : "1d";
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
  const envFounderEmail = (process.env.FOUNDER_EMAIL || "").trim().toLowerCase();
  const envFounderAadhaar = (process.env.FOUNDER_AADHAAR || "000000000000").trim().replace(/\s+/g, "");

  let founder = await dbFindUser({ role: "founder" });
  if (!founder && envFounderEmail) {
    founder = await dbFindUser({ email: envFounderEmail });
  }

  if (!founder) {
    const hashedAadhaar = hashAadhaar(envFounderAadhaar);

    founder = {
      _id: `founder_${Date.now()}`,
      name: "Main Admin (Founder)",
      email: envFounderEmail || email,
      mobile: "9999999999",
      dob: "01011990",
      role: "founder",
      aadhaar_last4: envFounderAadhaar.slice(-4),
      aadhaar_hash: hashedAadhaar,
      pan: "ADMIN00000",
      created_at: new Date().toISOString(),
    };

    await dbInsertUser(founder);

    // Initialize default group if not present
    let activeGroup = await dbGetActiveGroup();
    if (!activeGroup) {
      activeGroup = {
        _id: `grp_bbcc_${Date.now()}`,
        name: "BBCC Fund Grup (मुख्य बचत समूह)",
        monthly_amount: 5000,
        due_date_day: 5,
        total_cycle_months: 12,
        current_cycle_month: 1,
        max_members: 12,
        description: "12 महीने का पारदर्शी बचत फंड, हर माह 5 तारीख तक अंशदान जमा करना होगा।",
        status: "active",
        created_by: founder._id,
        created_at: new Date().toISOString(),
      };
      await dbInsertGroup(activeGroup);
    }

    const members = await dbFindGroupMembers(activeGroup._id);
    if (!members.some((m) => m.user_id === founder!._id)) {
      await dbInsertGroupMember({
        _id: `gm_${Date.now()}`,
        group_id: activeGroup._id,
        user_id: founder._id,
        joined_at: new Date().toISOString(),
        status: "approved",
        has_received_payout: false,
      });
    }
  } else if (founder.email !== envFounderEmail) {
    founder.email = envFounderEmail;
    await dbUpdateUser(founder._id, { email: envFounderEmail });
  }

  return founder;
}

// Pure Email + OTP Verifier: Identifies Admin vs Client
export async function verifyUserOtp(email: string, otp: string): Promise<User | null> {
  const cleanEmail = sanitize(email).trim().toLowerCase();
  const cleanOtp = sanitize(otp).trim();

  if (!cleanEmail || !cleanOtp) {
    return null;
  }

  const envFounderEmail = (process.env.FOUNDER_EMAIL || "").trim().toLowerCase();
  const isAdmin = Boolean(envFounderEmail && cleanEmail === envFounderEmail);

  let user: User | null = null;

  if (isAdmin) {
    user = await getOrCreateAdmin(cleanEmail);
  } else {
    user = await dbFindUser({ email: cleanEmail });
  }

  if (!user) {
    return null;
  }

  // Validate OTP code and expiration
  const storedOtp = user.otp_code?.trim();
  const expiresAt = user.otp_expires_at ? new Date(user.otp_expires_at).getTime() : 0;
  const isExpired = Date.now() > expiresAt;

  if (storedOtp && storedOtp === cleanOtp && !isExpired) {
    // Clear OTP after successful use
    await dbUpdateUser(user._id, { otp_code: "", otp_expires_at: "" });
    return user;
  }

  return null;
}
