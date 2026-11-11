import jwt from "jsonwebtoken";
import { getLocalStore } from "./astra";
import { User } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "bbcc_fund_grup_jwt_secret_default";

export interface SessionPayload {
  userId: string;
  name: string;
  role: "founder" | "admin" | "manager" | "member";
  mobile: string;
  aadhaar?: string;
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

// Unified Authenticator
export async function authenticateUser(identifier: string, secret: string): Promise<User | null> {
  const cleanId = identifier.trim().replace(/\s+/g, "");
  const cleanSecret = secret.trim().replace(/\s+/g, "");

  // 1. Check Super Admin / Founder Fixed Credentials
  const adminAadhaar = process.env.FOUNDER_AADHAAR || "649712349707";
  const adminPassword = process.env.FOUNDER_PASSWORD || "09042001";

  if (cleanId === adminAadhaar && cleanSecret === adminPassword) {
    const store = getLocalStore();
    let founder = store.users.find((u) => u.role === "founder");
    if (!founder) {
      founder = {
        _id: "founder_01",
        name: "Main Admin (Founder)",
        mobile: "9999999999",
        dob: "09042001",
        role: "founder",
        aadhaar: adminAadhaar,
        pan: "ABCDE1234F",
        created_at: new Date().toISOString(),
      };
      store.users.push(founder);
    }
    return founder;
  }

  // 2. Check Database / Store for Manager or Client Member
  const store = getLocalStore();

  // Search by Mobile, Aadhaar, or User ID
  const matchedUser = store.users.find(
    (u) =>
      u.mobile === cleanId ||
      u.aadhaar === cleanId ||
      u._id === cleanId
  );

  if (!matchedUser) {
    return null;
  }

  // If Manager, check custom password or DOB
  if (matchedUser.role === "manager") {
    if (
      matchedUser.custom_password === cleanSecret ||
      matchedUser.dob.replace(/[-/]/g, "") === cleanSecret.replace(/[-/]/g, "")
    ) {
      return matchedUser;
    }
    return null;
  }

  // If Member/Client, check DOB (matches DDMMYYYY or YYYYMMDD or with hyphens)
  const userDobClean = matchedUser.dob.replace(/[-/]/g, "");
  const secretClean = cleanSecret.replace(/[-/]/g, "");

  if (userDobClean === secretClean) {
    return matchedUser;
  }

  return null;
}
