import { DataAPIClient, Db } from "@datastax/astra-db-ts";
import { User, FundGroup, GroupMember, Contribution, WithdrawalRequest, Vote, PayoutDisbursal } from "./types";

let dbInstance: Db | null = null;

// Initialize Astra DB client if valid credentials are present
export function getAstraDb(): Db | null {
  const token = process.env.ASTRA_DB_APPLICATION_TOKEN;
  const endpoint = process.env.ASTRA_DB_API_ENDPOINT;

  if (!token || !endpoint || endpoint.includes("placeholder") || token.includes("placeholder")) {
    return null;
  }

  if (!dbInstance) {
    try {
      const client = new DataAPIClient(token);
      dbInstance = client.db(endpoint, {
        keyspace: process.env.ASTRA_DB_KEYSPACE || "default_keyspace",
      });
    } catch (err) {
      console.warn("Astra DB connection failed, using in-memory store:", err);
      return null;
    }
  }

  return dbInstance;
}

// In-Memory Fallback Store (for immediate testing or before DB connection is configured)
declare global {
  // eslint-disable-next-line no-var
  var __bbcc_store: {
    users: User[];
    groups: FundGroup[];
    group_members: GroupMember[];
    contributions: Contribution[];
    withdrawal_requests: WithdrawalRequest[];
    votes: Vote[];
    payouts: PayoutDisbursal[];
  } | undefined;
}

export function getLocalStore() {
  if (!global.__bbcc_store) {
    global.__bbcc_store = {
      users: [
        {
          _id: "founder_01",
          name: "Main Admin (Founder)",
          mobile: "9999999999",
          dob: "09042001",
          role: "founder",
          aadhaar: "649712349707",
          pan: "ABCDE1234F",
          created_at: new Date().toISOString(),
        },
        {
          _id: "mgr_01",
          name: "Ramesh Sharma (Managing Director)",
          mobile: "9876543210",
          dob: "15081990",
          role: "manager",
          aadhaar: "555544443333",
          pan: "XYZPQ9876R",
          custom_password: "manager_pass_123",
          created_at: new Date().toISOString(),
        },
        {
          _id: "client_01",
          name: "Amit Kumar",
          mobile: "9811122233",
          dob: "01011995",
          role: "member",
          aadhaar: "123456789012",
          pan: "AMITK1234A",
          bank_details: {
            account_number: "987654321001",
            ifsc: "SBIN0001234",
            upi_id: "amit@upi",
          },
          created_at: new Date().toISOString(),
        },
        {
          _id: "client_02",
          name: "Sunil Verma",
          mobile: "9822233344",
          dob: "12051996",
          role: "member",
          aadhaar: "234567890123",
          pan: "SUNIL2345B",
          bank_details: {
            account_number: "987654321002",
            ifsc: "PUNB0005678",
            upi_id: "sunil@upi",
          },
          created_at: new Date().toISOString(),
        },
        {
          _id: "client_03",
          name: "Vikram Singh",
          mobile: "9833344455",
          dob: "20101994",
          role: "member",
          aadhaar: "345678901234",
          pan: "VIKRM3456C",
          bank_details: {
            account_number: "987654321003",
            ifsc: "HDFC0001122",
            upi_id: "vikram@upi",
          },
          created_at: new Date().toISOString(),
        },
      ],
      groups: [
        {
          _id: "grp_bbcc_01",
          name: "BBCC Fund Grup - Pool #1",
          monthly_amount: 5000,
          due_date_day: 5,
          total_cycle_months: 12,
          current_cycle_month: 1,
          status: "active",
          created_by: "founder_01",
          created_at: new Date().toISOString(),
        },
      ],
      group_members: [
        {
          _id: "gm_founder",
          group_id: "grp_bbcc_01",
          user_id: "founder_01",
          joined_at: new Date().toISOString(),
          has_received_payout: false,
        },
        {
          _id: "gm_mgr",
          group_id: "grp_bbcc_01",
          user_id: "mgr_01",
          joined_at: new Date().toISOString(),
          has_received_payout: false,
        },
        {
          _id: "gm_01",
          group_id: "grp_bbcc_01",
          user_id: "client_01",
          joined_at: new Date().toISOString(),
          has_received_payout: false,
        },
        {
          _id: "gm_02",
          group_id: "grp_bbcc_01",
          user_id: "client_02",
          joined_at: new Date().toISOString(),
          has_received_payout: false,
        },
        {
          _id: "gm_03",
          group_id: "grp_bbcc_01",
          user_id: "client_03",
          joined_at: new Date().toISOString(),
          has_received_payout: false,
        },
      ],
      contributions: [
        {
          _id: "pay_founder",
          group_id: "grp_bbcc_01",
          user_id: "founder_01",
          user_name: "Main Admin (Founder)",
          cycle_month: 1,
          amount: 5000,
          status: "paid",
          paid_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          _id: "pay_mgr",
          group_id: "grp_bbcc_01",
          user_id: "mgr_01",
          user_name: "Ramesh Sharma (MD / Manager)",
          cycle_month: 1,
          amount: 5000,
          status: "paid",
          paid_at: new Date(Date.now() - 86400000 * 2.5).toISOString(),
        },
        {
          _id: "pay_01",
          group_id: "grp_bbcc_01",
          user_id: "client_01",
          user_name: "Amit Kumar",
          cycle_month: 1,
          amount: 5000,
          status: "paid",
          paid_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          _id: "pay_02",
          group_id: "grp_bbcc_01",
          user_id: "client_02",
          user_name: "Sunil Verma",
          cycle_month: 1,
          amount: 5000,
          status: "paid",
          paid_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      withdrawal_requests: [],
      votes: [],
      payouts: [],
    };
  }
  return global.__bbcc_store;
}
