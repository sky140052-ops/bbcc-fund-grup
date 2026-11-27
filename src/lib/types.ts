export type UserRole = "admin" | "founder" | "member" | "client";

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  mobile: string;
  aadhaar?: string;
}

// ==========================================
// DFI MEMBER TYPE
// ==========================================
export interface Member {
  _id: string;
  name: string;
  email: string; // Member's unique email for OTP login
  mobile: string;
  photo?: string; // Base64 data URL (Live Camera Selfie or JPEG/PNG)
  aadhaar_number: string; // 12-digit Aadhaar number
  aadhaar_file?: string; // Base64 data URL (PDF or Image)
  aadhaar_file_type?: "pdf" | "image";
  aadhaar_file_name?: string;
  pan_number?: string; // 10-char PAN (Optional)
  pan_file?: string; // Base64 data URL (PDF or Image)
  pan_file_type?: "pdf" | "image";
  pan_file_name?: string;
  // Payment Details
  upi_id?: string;
  account_number?: string;
  ifsc?: string;
  bank_name?: string;
  wallet_number?: string; // PhonePe / Google Pay / Paytm mobile number
  otp_code?: string;
  otp_expires_at?: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// DFI CONTRIBUTION TYPE (Monthly Deposit)
// ==========================================
export interface Contribution {
  _id: string;
  member_id: string;
  member_name: string;
  member_mobile: string;
  amount: number; // e.g. ₹100 (Original deposit amount credited to savings)
  platform_fee?: number; // e.g. ₹3 (Platform maintenance fee, not credited to savings)
  total_paid?: number; // Total amount paid via UPI (amount + platform_fee, e.g. ₹103)
  month: string; // e.g. "2026-11"
  status: "paid" | "pending" | "rejected" | "failed";
  payment_screenshot?: string; // Member uploaded payment screenshot
  submitted_at?: string; // Timestamp when screenshot submitted
  approved_at?: string; // Timestamp when approved (manual or auto)
  auto_approved?: boolean; // true if auto-approved after 24 hours
  rejection_reason?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  paid_at: string;
  note?: string;
  group_id?: string;
  user_id?: string;
  user_name?: string;
  cycle_month?: number;
}

// ==========================================
// DFI LOAN TYPE
// ==========================================
export interface Loan {
  _id: string;
  member_id: string;
  member_name: string;
  member_mobile: string;
  member_upi?: string;
  member_wallet?: string;
  member_account?: string;
  member_ifsc?: string;
  requested_amount: number; // Member requested amount (max 90% of total deposit)
  processing_fee_percent: number; // Flat 10%
  processing_fee_amount: number; // requested_amount * 0.10
  disbursed_amount: number; // requested_amount * 0.90 (Net amount admin sends)
  interest_rate_monthly: number; // 1% per month (1% p.m.)
  status: "pending" | "approved" | "disbursed" | "repaid" | "rejected";
  requested_at: string;
  reason?: string;
  // Disbursal by Admin
  disbursed_at?: string;
  transaction_utr?: string;
  payment_screenshot?: string; // Screenshot proof visible to all members
  admin_notes?: string;
  // Repayment by Member
  interest_accumulated?: number;
  total_payable?: number;
  total_repaid?: number;
  repaid_at?: string;
  repayment_screenshot?: string;
  repayment_submitted_at?: string;
  repayment_status?: "pending_approval" | "approved" | "rejected";
  repayment_auto_approved?: boolean;
  repayment_razorpay_id?: string;
}

// ==========================================
// DFI SYSTEM SETTINGS & DATE CONTROLS
// ==========================================
export interface SystemSettings {
  _id: string;
  registration_link_active: boolean; // Admin can enable/disable self-registration link
  allow_deposit_after_10th: boolean; // Default false (deposit button visible only 1-10, admin can activate after 10th)
  allow_loan_repay_after_15th: boolean; // Default false (loan repay button visible only up to 15th, admin can re-enable)
  monthly_contribution_amount?: number; // Monthly deposit amount configured by Admin (Default ₹100)
  platform_fee?: number; // Flat ₹3 platform maintenance fee (Default ₹3)
  // Direct UPI & QR Code Settings (Replaces 3rd-party Payment Gateway)
  admin_upi_id?: string; // Admin's UPI ID (e.g. sky140052@okaxis)
  admin_upi_name?: string; // Receiver Display Name (e.g. DFI इमरजेंसी सेवा)
  admin_qr_code?: string; // Base64 image of Admin's PhonePe / GPay / Paytm QR code
  admin_bank_name?: string;
  admin_account_number?: string;
  admin_ifsc?: string;
  admin_account_holder?: string;
  brevo_api_key?: string; // Brevo API key (v3 SMTP API)
  brevo_sender_email?: string; // Verified sender email in Brevo
  smtp_email?: string; // Optional Gmail SMTP address
  smtp_password?: string; // Optional Gmail SMTP App Password
  reset_otp?: string; // Confirmation OTP for Fresh Public Launch & Database Reset
  reset_otp_expires_at?: string; // Expiry timestamp for reset OTP
  updated_at: string;
}

// Legacy user interface for backward compatibility
export interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  dob?: string;
  role: UserRole;
  aadhaar_last4?: string;
  aadhaar_hash?: string;
  pan?: string;
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
  photo_live?: string;
  aadhaar_front?: string;
  aadhaar_back?: string;
  pan_type?: "physical" | "epan";
  pan_document?: string;
  epan_password?: string;
  password_hash?: string;
  bank_details?: {
    account_number: string;
    ifsc: string;
    upi_id: string;
  };
  otp_code?: string;
  otp_expires_at?: string;
  created_at: string;
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
