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

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

// Enterprise-Grade Secure Authenticator
export async function authenticateUser(identifier: string, secret: string): Promise<User | null> {
  const cleanId = sanitize(identifier).replace(/\s+/g, "");
  const cleanSecret = sanitize(secret).replace(/\s+/g, "");

  if (!cleanId || !cleanSecret) {
    return null;
  }

  // 1. Super Admin / Founder Validation (from Render Environment Variables)
  const envFounderAadhaar = (process.env.FOUNDER_AADHAAR || "649712349707").trim().replace(/\s+/g, "");
  const envFounderPassword = (process.env.FOUNDER_PASSWORD || "09042001").trim().replace(/\s+/g, "");

  if (cleanId === envFounderAadhaar && cleanSecret === envFounderPassword) {
    // Check if founder already exists in database
    let founder = await dbFindUser({ role: "founder" });

    if (!founder) {
      // First-time initialization: Persist founder with hashed password and hashed Aadhaar in Astra DB
      const hashedPassword = await hashPassword(envFounderPassword);
      const hashedAadhaar = hashAadhaar(envFounderAadhaar);

      founder = {
        _id: `founder_${Date.now()}`,
        name: "Main Admin (Founder)",
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

  // 2. Search Database for Manager (MD) or Client (Member)
  const idHash = hashAadhaar(cleanId);

  // Search by mobile, user ID, or hashed Aadhaar (constant time lookup)
  let matchedUser = await dbFindUser({ mobile: cleanId });
  if (!matchedUser) {
    matchedUser = await dbFindUser({ _id: cleanId });
  }
  if (!matchedUser) {
    matchedUser = await dbFindUser({ aadhaar_hash: idHash });
  }

  if (!matchedUser) {
    return null;
  }

  // 3. Manager (MD) Authentication using Bcrypt Hash
  if (matchedUser.role === "manager") {
    if (matchedUser.password_hash) {
      const isValid = await verifyPassword(cleanSecret, matchedUser.password_hash);
      if (isValid) return matchedUser;
    }
    // Also allow DOB fallback if manager logs in with DOB
    const userDobClean = matchedUser.dob.replace(/[-/]/g, "");
    const secretClean = cleanSecret.replace(/[-/]/g, "");
    if (userDobClean === secretClean) {
      return matchedUser;
    }
    return null;
  }

  // 4. Client (Member) Authentication: Secure DOB verification
  const userDobClean = matchedUser.dob.replace(/[-/]/g, "");
  const secretClean = cleanSecret.replace(/[-/]/g, "");

  if (userDobClean === secretClean) {
    return matchedUser;
  }

  return null;
}
