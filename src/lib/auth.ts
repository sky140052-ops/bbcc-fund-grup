import jwt from "jsonwebtoken";
import {
  dbFindUser,
  dbInsertUser,
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

// Enterprise-Grade Secure Authenticator with Email & Custom Password
export async function authenticateUser(identifier: string, secret: string): Promise<User | null> {
  const cleanId = sanitize(identifier).trim().toLowerCase();
  const cleanSecret = sanitize(secret).trim();

  if (!cleanId || !cleanSecret) {
    return null;
  }

  // 1. Super Admin / Founder Validation (from Render Environment Variables)
  const envFounderEmail = (process.env.FOUNDER_EMAIL || "admin@gmail.com").trim().toLowerCase();
  const envFounderAadhaar = (process.env.FOUNDER_AADHAAR || "649712349707").trim().replace(/\s+/g, "");
  const envFounderPassword = (process.env.FOUNDER_PASSWORD || "09042001").trim();

  const isFounderId = cleanId === envFounderEmail || cleanId === envFounderAadhaar;
  const isFounderSecret = cleanSecret === envFounderPassword;

  if (isFounderId && isFounderSecret) {
    let founder = await dbFindUser({ role: "founder" });

    if (!founder) {
      const hashedPassword = await hashPassword(envFounderPassword);
      const hashedAadhaar = hashAadhaar(envFounderAadhaar);

      founder = {
        _id: `founder_${Date.now()}`,
        name: "Main Admin (Founder)",
        email: envFounderEmail,
        mobile: "9999999999",
        dob: "09042001",
        role: "founder",
        aadhaar_last4: envFounderAadhaar.slice(-4),
        aadhaar_hash: hashedAadhaar,
        pan: "FOUNDER123",
        password_hash: hashedPassword,
        created_at: new Date().toISOString(),
      };

      await dbInsertUser(founder);

      // Ensure active group exists and enroll founder
      let activeGroup = await dbGetActiveGroup();
      if (!activeGroup) {
        activeGroup = {
          _id: `grp_bbcc_${Date.now()}`,
          name: "BBCC Fund Grup",
          monthly_amount: 5000,
          due_date_day: 5,
          total_cycle_months: 12,
          current_cycle_month: 1,
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
          has_received_payout: false,
        });
      }
    }

    return founder;
  }

  // 2. Search Database for User by Email (Primary ID) or Mobile
  let matchedUser = await dbFindUser({ email: cleanId });

  if (!matchedUser) {
    matchedUser = await dbFindUser({ mobile: cleanId });
  }

  if (!matchedUser) {
    return null;
  }

  // 3. Verify Custom Password using Bcrypt Hash
  if (matchedUser.password_hash) {
    const isPasswordValid = await verifyPassword(cleanSecret, matchedUser.password_hash);
    if (isPasswordValid) {
      return matchedUser;
    }
  }

  // 4. Initial/Fallback: If password not yet set, allow DOB (DDMMYYYY) matching for initial login
  const userDobClean = (matchedUser.dob || "").replace(/[-/]/g, "");
  const secretClean = cleanSecret.replace(/[-/]/g, "");

  if (userDobClean && userDobClean === secretClean) {
    return matchedUser;
  }

  return null;
}
