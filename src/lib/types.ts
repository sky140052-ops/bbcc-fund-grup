export type UserRole = "admin" | "client" | "founder" | "member";

export interface SessionPayload {
  userId: string;
  name: string;
  email?: string;
  role: UserRole;
  mobile: string;
  aadhaar?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string; // Registered Gmail / Email
  mobile: string;
  dob: string; // YYYY-MM-DD or DDMMYYYY
  role: UserRole;
  aadhaar_last4: string; // Only last 4 digits stored for display
  aadhaar_hash: string; // Secure HMAC-SHA256 for zero-knowledge search
  pan: string;
  bank_details?: {
    account_number: string;
    ifsc: string;
    upi_id: string;
  };
  // Loan-Grade KYC Details
  father_name?: string;
  gender?: string;
  marital_status?: string;
  address?: string;
  city?: string;
  pincode?: string;
  occupation?: string;
  monthly_income?: string;
  nominee_name?: string;
  nominee_relation?: string;
  nominee_mobile?: string;
  // Documents & Live Photos (Base64 Data)
  photo_live?: string; // Live webcam / camera photo
  aadhaar_front?: string; // Aadhaar card front image
  aadhaar_back?: string; // Aadhaar card back image
  pan_type?: "physical" | "epan";
  pan_document?: string; // PAN card image or e-PAN file
  epan_password?: string; // Password if e-PAN uploaded
  password_hash?: string; // bcrypt hash for custom password
  otp_code?: string; // 6-digit OTP for password reset / login
  otp_expires_at?: string; // Expiration timestamp
  created_at: string;
}

// ==========================================
// DFI MEMBER TYPE
// ==========================================
export interface Member {
  _id: string;
  name: string;
  mobile: string;
  photo?: string; // Base64 data URL (Live Camera Selfie or JPEG/PNG)
  aadhaar_number: string; // 12-digit Aadhaar number
  aadhaar_file?: string; // Base64 data URL (PDF or Image)
  aadhaar_file_type?: "pdf" | "image";
  aadhaar_file_name?: string;
  pan_number: string; // 10-char PAN
  pan_file?: string; // Base64 data URL (PDF or Image)
  pan_file_type?: "pdf" | "image";
  pan_file_name?: string;
  // Payment Details
  upi_id?: string;
  account_number?: string;
  ifsc?: string;
  bank_name?: string;
  wallet_number?: string; // PhonePe / Google Pay / Paytm mobile number
  created_at: string;
  updated_at?: string;
}

export interface FundGroup {
  _id: string;
  name: string;
  monthly_amount: number;
  due_date_day: number;
  start_date?: string;
  end_date?: string;
  total_cycle_months: number;
  current_cycle_month: number;
  max_members?: number;
  description?: string;
  status: "active" | "completed";
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  _id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  status?: "pending" | "approved" | "rejected";
  has_received_payout: boolean;
  received_in_month?: number | null;
}

export interface Contribution {
  _id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  cycle_month: number;
  amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  status: "paid" | "pending" | "failed";
  paid_at?: string;
}

export interface WithdrawalRequest {
  _id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  cycle_month: number;
  reason: string;
  requested_amount: number;
  deduction_fee: number;
  net_payable_amount: number;
  repayment_duration_days: number;
  repayment_due_date: string;
  interest_rate_monthly_percent: number;
  votes_count: number;
  status: "voting" | "approved" | "disbursed" | "rejected" | "repaid";
  admin_approved: boolean;
  admin_approved_at?: string;
  disbursed_at?: string;
  transaction_utr_id?: string;
  payment_screenshot_url?: string;
  founder_approved?: boolean;
  founder_approved_at?: string;
  md_approved?: boolean;
  md_approved_at?: string;
  created_at: string;
}

export interface Vote {
  _id: string;
  group_id: string;
  cycle_month: number;
  voter_user_id: string;
  candidate_request_id: string;
  voted_at: string;
}

export interface PayoutDisbursal {
  _id: string;
  group_id: string;
  request_id: string;
  recipient_user_id: string;
  recipient_name: string;
  gross_amount: number;
  deduction_fee: number;
  net_disbursed_amount: number;
  disbursed_at: string;
  payment_screenshot_url: string;
  transaction_utr_id: string;
  repayment_due_date: string;
  interest_start_date: string;
  interest_rate_monthly_percent: number;
}
