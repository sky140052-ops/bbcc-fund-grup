export type UserRole = "admin" | "founder" | "manager" | "member";

export interface User {
  _id: string;
  name: string;
  mobile: string;
  dob: string; // YYYY-MM-DD or DDMMYYYY
  role: UserRole;
  aadhaar: string; // Stored securely
  pan: string;
  bank_details?: {
    account_number: string;
    ifsc: string;
    upi_id: string;
  };
  custom_password?: string; // For manager
  created_at: string;
}

export interface FundGroup {
  _id: string;
  name: string;
  monthly_amount: number;
  due_date_day: number; // e.g. 5 (5th of every month)
  total_cycle_months: number;
  current_cycle_month: number;
  status: "active" | "completed";
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  _id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
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
  requested_amount: number; // Max pool balance
  deduction_fee: number; // Flat ₹20
  net_payable_amount: number; // requested_amount - 20
  repayment_duration_days: number;
  repayment_due_date: string;
  interest_rate_monthly_percent: number; // 1%
  votes_count: number;
  status: "voting" | "approved" | "disbursed" | "rejected" | "repaid";
  founder_approved: boolean;
  founder_approved_at?: string;
  md_approved: boolean;
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
  deduction_fee: number; // ₹20
  net_disbursed_amount: number; // gross - 20
  disbursed_at: string;
  payment_screenshot_url: string;
  transaction_utr_id: string;
  repayment_due_date: string;
  interest_start_date: string;
  interest_rate_monthly_percent: number; // 1%
}
