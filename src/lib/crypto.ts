import bcrypt from "bcryptjs";
import crypto from "crypto";

const SECRET_SALT = process.env.JWT_SECRET || "bbcc_fund_secure_salt_default_key";

/**
 * Hash password using bcrypt with 12 salt rounds (industry standard)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password against bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Hash sensitive 12-digit Aadhaar number using HMAC-SHA256
 * Full Aadhaar is NEVER stored in database, preventing identity leaks!
 */
export function hashAadhaar(aadhaar: string): string {
  const clean = aadhaar.trim().replace(/\D/g, "");
  return crypto.createHmac("sha256", SECRET_SALT).update(clean).digest("hex");
}

/**
 * Sanitize string inputs to prevent script injection / XSS
 */
export function sanitize(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>]/g, ""); // strip angle brackets
}
