import { DataAPIClient, Db } from "@datastax/astra-db-ts";
import { User, Member, FundGroup, GroupMember, Contribution, WithdrawalRequest, Vote, PayoutDisbursal, Loan, SystemSettings } from "./types";

let dbInstance: Db | null = null;
const initializedCollections = new Set<string>();

// Get Astra DB instance if valid credentials exist
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
      console.warn("Astra DB connection failed, falling back to clean store:", err);
      return null;
    }
  }

  return dbInstance;
}

// Ensure collection exists in Astra DB
async function getCollection<T extends Record<string, any>>(name: string) {
  const db = getAstraDb();
  if (!db) return null;

  if (!initializedCollections.has(name)) {
    try {
      await db.createCollection(name);
    } catch {
      // Collection might already exist
    }
    initializedCollections.add(name);
  }

  return db.collection<T>(name);
}

// Clean in-memory fallback store - ZERO DUMMY DATA!
declare global {
  // eslint-disable-next-line no-var
  var __bbcc_clean_store: {
    users: User[];
    members: Member[];
    groups: FundGroup[];
    group_members: GroupMember[];
    contributions: Contribution[];
    loans: Loan[];
    withdrawal_requests: WithdrawalRequest[];
    votes: Vote[];
    payouts: PayoutDisbursal[];
    settings?: SystemSettings;
  } | undefined;
}

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  _id: "dfi_system_settings",
  registration_link_active: true,
  allow_deposit_after_10th: false,
  allow_loan_repay_after_15th: false,
  updated_at: new Date().toISOString(),
};

export function getCleanStore() {
  if (!global.__bbcc_clean_store) {
    global.__bbcc_clean_store = {
      users: [],
      members: [],
      groups: [],
      group_members: [],
      contributions: [],
      loans: [],
      withdrawal_requests: [],
      votes: [],
      payouts: [],
      settings: { ...DEFAULT_SYSTEM_SETTINGS },
    };
  }
  if (!global.__bbcc_clean_store.settings) {
    global.__bbcc_clean_store.settings = { ...DEFAULT_SYSTEM_SETTINGS };
  }
  return global.__bbcc_clean_store;
}

// ==========================================
// UNIFIED DATA ACCESS METHODS (Astra DB Native)
// ==========================================

// USERS
export async function dbFindUsers(filter: Record<string, any> = {}): Promise<User[]> {
  const col = await getCollection<User>("users");
  if (col) {
    return await col.find(filter).toArray();
  }
  const store = getCleanStore();
  return store.users.filter((u) => {
    return Object.entries(filter).every(([k, v]) => (u as any)[k] === v);
  });
}

export async function dbFindUser(filter: Record<string, any>): Promise<User | null> {
  const col = await getCollection<User>("users");
  if (col) {
    return await col.findOne(filter);
  }
  const store = getCleanStore();
  const found = store.users.find((u) => {
    return Object.entries(filter).every(([k, v]) => (u as any)[k] === v);
  });
  return found || null;
}

export async function dbInsertUser(user: User): Promise<User> {
  const col = await getCollection<User>("users");
  if (col) {
    await col.insertOne(user as any);
    return user;
  }
  const store = getCleanStore();
  store.users.push(user);
  return user;
}

export async function dbUpdateUser(userId: string, updates: Partial<User>): Promise<void> {
  const col = await getCollection<User>("users");
  if (col) {
    await col.updateOne({ _id: userId } as any, { $set: updates as any });
    return;
  }
  const store = getCleanStore();
  const idx = store.users.findIndex((u) => u._id === userId);
  if (idx !== -1) {
    store.users[idx] = { ...store.users[idx], ...updates };
  }
}

export async function dbDeleteUser(userId: string): Promise<boolean> {
  const col = await getCollection<User>("users");
  if (col) {
    await col.deleteOne({ _id: userId } as any);
    const gmCol = await getCollection<GroupMember>("group_members");
    if (gmCol) {
      await gmCol.deleteMany({ user_id: userId } as any);
    }
    return true;
  }
  const store = getCleanStore();
  const idx = store.users.findIndex((u) => u._id === userId);
  if (idx !== -1) {
    store.users.splice(idx, 1);
    store.group_members = store.group_members.filter((gm) => gm.user_id !== userId);
    return true;
  }
  return false;
}

// GROUPS
export async function dbFindGroups(filter: Record<string, any> = {}): Promise<FundGroup[]> {
  const col = await getCollection<FundGroup>("groups");
  if (col) {
    return await col.find(filter).toArray();
  }
  const store = getCleanStore();
  return store.groups.filter((g) => {
    return Object.entries(filter).every(([k, v]) => (g as any)[k] === v);
  });
}

export async function dbFindGroupById(groupId: string): Promise<FundGroup | null> {
  const col = await getCollection<FundGroup>("groups");
  if (col) {
    return await col.findOne({ _id: groupId });
  }
  const store = getCleanStore();
  return store.groups.find((g) => g._id === groupId) || null;
}

export async function dbGetActiveGroup(): Promise<FundGroup | null> {
  const col = await getCollection<FundGroup>("groups");
  if (col) {
    const grp = await col.findOne({ status: "active" });
    return grp || (await col.findOne({})) || null;
  }
  const store = getCleanStore();
  return store.groups.find((g) => g.status === "active") || store.groups[0] || null;
}

export async function dbInsertGroup(group: FundGroup): Promise<FundGroup> {
  const col = await getCollection<FundGroup>("groups");
  if (col) {
    await col.insertOne(group as any);
    return group;
  }
  const store = getCleanStore();
  store.groups.push(group);
  return group;
}

// GROUP MEMBERS
export async function dbFindGroupMembers(groupId: string): Promise<GroupMember[]> {
  const col = await getCollection<GroupMember>("group_members");
  if (col) {
    return await col.find({ group_id: groupId }).toArray();
  }
  const store = getCleanStore();
  return store.group_members.filter((gm) => gm.group_id === groupId);
}

export async function dbFindAllGroupMembers(filter: Record<string, any> = {}): Promise<GroupMember[]> {
  const col = await getCollection<GroupMember>("group_members");
  if (col) {
    return await col.find(filter).toArray();
  }
  const store = getCleanStore();
  return store.group_members.filter((gm) => {
    return Object.entries(filter).every(([k, v]) => (gm as any)[k] === v);
  });
}

export async function dbInsertGroupMember(member: GroupMember): Promise<void> {
  const col = await getCollection<GroupMember>("group_members");
  if (col) {
    await col.insertOne(member as any);
    return;
  }
  const store = getCleanStore();
  store.group_members.push(member);
}

export async function dbUpdateGroupMemberById(memberId: string, updates: Partial<GroupMember>): Promise<void> {
  const col = await getCollection<GroupMember>("group_members");
  if (col) {
    await col.updateOne({ _id: memberId } as any, { $set: updates as any });
    return;
  }
  const store = getCleanStore();
  const idx = store.group_members.findIndex((gm) => gm._id === memberId);
  if (idx !== -1) {
    store.group_members[idx] = { ...store.group_members[idx], ...updates };
  }
}

export async function dbUpdateGroupMember(
  groupId: string,
  userId: string,
  updates: Partial<GroupMember>
): Promise<void> {
  const col = await getCollection<GroupMember>("group_members");
  if (col) {
    await col.updateOne({ group_id: groupId, user_id: userId } as any, { $set: updates as any });
    return;
  }
  const store = getCleanStore();
  const idx = store.group_members.findIndex(
    (gm) => gm.group_id === groupId && gm.user_id === userId
  );
  if (idx !== -1) {
    store.group_members[idx] = { ...store.group_members[idx], ...updates };
  }
}

// CONTRIBUTIONS
export async function dbFindContributions(groupId?: string): Promise<Contribution[]> {
  const col = await getCollection<Contribution>("contributions");
  if (col) {
    return groupId ? await col.find({ group_id: groupId }).toArray() : await col.find({}).toArray();
  }
  const store = getCleanStore();
  return groupId ? store.contributions.filter((c) => c.group_id === groupId) : store.contributions;
}

export async function dbInsertContribution(contrib: Contribution): Promise<void> {
  const col = await getCollection<Contribution>("contributions");
  if (col) {
    await col.insertOne(contrib as any);
    return;
  }
  const store = getCleanStore();
  store.contributions.push(contrib);
}

// WITHDRAWAL REQUESTS
export async function dbFindWithdrawalRequests(groupId?: string): Promise<WithdrawalRequest[]> {
  const col = await getCollection<WithdrawalRequest>("withdrawal_requests");
  if (col) {
    return groupId ? await col.find({ group_id: groupId }).toArray() : await col.find({}).toArray();
  }
  const store = getCleanStore();
  return groupId
    ? store.withdrawal_requests.filter((r) => r.group_id === groupId)
    : store.withdrawal_requests;
}

export async function dbFindWithdrawalRequestById(id: string): Promise<WithdrawalRequest | null> {
  const col = await getCollection<WithdrawalRequest>("withdrawal_requests");
  if (col) {
    return await col.findOne({ _id: id } as any);
  }
  const store = getCleanStore();
  return store.withdrawal_requests.find((r) => r._id === id) || null;
}

export async function dbInsertWithdrawalRequest(req: WithdrawalRequest): Promise<void> {
  const col = await getCollection<WithdrawalRequest>("withdrawal_requests");
  if (col) {
    await col.insertOne(req as any);
    return;
  }
  const store = getCleanStore();
  store.withdrawal_requests.push(req);
}

export async function dbUpdateWithdrawalRequest(
  id: string,
  updates: Partial<WithdrawalRequest>
): Promise<void> {
  const col = await getCollection<WithdrawalRequest>("withdrawal_requests");
  if (col) {
    await col.updateOne({ _id: id } as any, { $set: updates as any });
    return;
  }
  const store = getCleanStore();
  const idx = store.withdrawal_requests.findIndex((r) => r._id === id);
  if (idx !== -1) {
    store.withdrawal_requests[idx] = { ...store.withdrawal_requests[idx], ...updates };
  }
}

// VOTES
export async function dbFindVotes(groupId?: string, cycleMonth?: number): Promise<Vote[]> {
  const col = await getCollection<Vote>("votes");
  if (col) {
    const filter: Record<string, any> = {};
    if (groupId) filter.group_id = groupId;
    if (cycleMonth) filter.cycle_month = cycleMonth;
    return await col.find(filter).toArray();
  }
  const store = getCleanStore();
  return store.votes.filter((v) => {
    if (groupId && v.group_id !== groupId) return false;
    if (cycleMonth && v.cycle_month !== cycleMonth) return false;
    return true;
  });
}

export async function dbInsertVote(vote: Vote): Promise<void> {
  const col = await getCollection<Vote>("votes");
  if (col) {
    await col.insertOne(vote as any);
    return;
  }
  const store = getCleanStore();
  store.votes.push(vote);
}

// PAYOUTS
export async function dbFindPayouts(groupId?: string): Promise<PayoutDisbursal[]> {
  const col = await getCollection<PayoutDisbursal>("payouts");
  if (col) {
    return groupId ? await col.find({ group_id: groupId }).toArray() : await col.find({}).toArray();
  }
  const store = getCleanStore();
  return groupId ? store.payouts.filter((p) => p.group_id === groupId) : store.payouts;
}

export async function dbInsertPayout(payout: PayoutDisbursal): Promise<void> {
  const col = await getCollection<PayoutDisbursal>("payouts");
  if (col) {
    await col.insertOne(payout as any);
    return;
  }
  const store = getCleanStore();
  store.payouts.push(payout);
}

// ==========================================
// DFI MEMBERS OPERATIONS
// ==========================================
export async function dbFindMembers(filter: Record<string, any> = {}): Promise<Member[]> {
  const col = await getCollection<Member>("members");
  if (col) {
    return await col.find(filter).toArray();
  }
  const store = getCleanStore();
  return store.members.filter((m) => {
    return Object.entries(filter).every(([k, v]) => (m as any)[k] === v);
  });
}

export async function dbFindMemberById(id: string): Promise<Member | null> {
  const col = await getCollection<Member>("members");
  if (col) {
    return await col.findOne({ _id: id });
  }
  const store = getCleanStore();
  return store.members.find((m) => m._id === id) || null;
}

export async function dbFindMemberByEmail(email: string): Promise<Member | null> {
  const cleanEmail = email.trim().toLowerCase();
  const col = await getCollection<Member>("members");
  if (col) {
    return await col.findOne({ email: cleanEmail });
  }
  const store = getCleanStore();
  return store.members.find((m) => m.email?.toLowerCase() === cleanEmail) || null;
}

export async function dbFindMemberByMobile(mobile: string): Promise<Member | null> {
  const cleanMobile = mobile.replace(/\D/g, "");
  if (!cleanMobile) return null;
  const col = await getCollection<Member>("members");
  if (col) {
    const doc = await col.findOne({ mobile: cleanMobile });
    if (doc) return doc;
  }
  const store = getCleanStore();
  return store.members.find((m) => m.mobile?.replace(/\D/g, "") === cleanMobile) || null;
}

export async function dbFindMemberByAadhaar(aadhaar: string): Promise<Member | null> {
  const cleanAadhaar = aadhaar.replace(/\D/g, "");
  if (cleanAadhaar.length < 12) return null;
  const col = await getCollection<Member>("members");
  if (col) {
    const doc = await col.findOne({ aadhaar_number: cleanAadhaar });
    if (doc) return doc;
  }
  const store = getCleanStore();
  return store.members.find((m) => m.aadhaar_number?.replace(/\D/g, "") === cleanAadhaar) || null;
}

export async function dbFindMemberByPan(pan: string): Promise<Member | null> {
  const cleanPan = pan.trim().toUpperCase();
  if (cleanPan.length < 10) return null;
  const col = await getCollection<Member>("members");
  if (col) {
    const doc = await col.findOne({ pan_number: cleanPan });
    if (doc) return doc;
  }
  const store = getCleanStore();
  return store.members.find((m) => m.pan_number?.trim().toUpperCase() === cleanPan) || null;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  field?: "email" | "mobile" | "aadhaar_number" | "pan_number";
  message?: string;
}

export async function dbCheckDuplicateMember(params: {
  email?: string;
  mobile?: string;
  aadhaar_number?: string;
  pan_number?: string;
  excludeMemberId?: string;
}): Promise<DuplicateCheckResult> {
  const allMembers = await dbFindMembers();

  const cleanEmail = params.email ? params.email.trim().toLowerCase() : "";
  const cleanMobile = params.mobile ? params.mobile.replace(/\D/g, "") : "";
  const cleanAadhaar = params.aadhaar_number ? params.aadhaar_number.replace(/\D/g, "") : "";
  const cleanPan = params.pan_number ? params.pan_number.trim().toUpperCase() : "";

  // Prevent member from using Founder/Admin email
  const envFounderEmail = (process.env.FOUNDER_EMAIL || "sky140052@gmail.com").trim().toLowerCase();
  if (cleanEmail && cleanEmail === envFounderEmail) {
    return {
      isDuplicate: true,
      field: "email",
      message: "यह ईमेल मुख्य एडमिन के लिए आरक्षित है। सदस्य के रूप में इस ईमेल का उपयोग नहीं किया जा सकता।",
    };
  }

  for (const m of allMembers) {
    if (params.excludeMemberId && m._id === params.excludeMemberId) {
      continue;
    }

    // 1. Email check
    if (cleanEmail && m.email && m.email.trim().toLowerCase() === cleanEmail) {
      return {
        isDuplicate: true,
        field: "email",
        message: `यह ईमेल (${cleanEmail}) पहले से ही सदस्य '${m.name}' के खाते में पंजीकृत है। कृपया अलग ईमेल का उपयोग करें।`,
      };
    }

    // 2. Mobile check
    if (cleanMobile && cleanMobile.length >= 10 && m.mobile) {
      const mMobile = m.mobile.replace(/\D/g, "");
      if (mMobile === cleanMobile) {
        return {
          isDuplicate: true,
          field: "mobile",
          message: `यह मोबाइल नंबर (${cleanMobile}) पहले से ही सदस्य '${m.name}' के खाते में पंजीकृत है।`,
        };
      }
    }

    // 3. Aadhaar check
    if (cleanAadhaar && cleanAadhaar.length === 12 && m.aadhaar_number) {
      const mAadhaar = m.aadhaar_number.replace(/\D/g, "");
      if (mAadhaar === cleanAadhaar) {
        return {
          isDuplicate: true,
          field: "aadhaar_number",
          message: `यह आधार नंबर (${cleanAadhaar.slice(0, 4)} **** ${cleanAadhaar.slice(-4)}) पहले से ही सदस्य '${m.name}' के रिकॉर्ड में पंजीकृत है।`,
        };
      }
    }

    // 4. PAN check
    if (cleanPan && cleanPan.length >= 10 && m.pan_number) {
      const mPan = m.pan_number.trim().toUpperCase();
      if (mPan === cleanPan) {
        return {
          isDuplicate: true,
          field: "pan_number",
          message: `यह पैन कार्ड नंबर (${cleanPan}) पहले से ही सदस्य '${m.name}' के रिकॉर्ड में पंजीकृत है।`,
        };
      }
    }
  }

  return { isDuplicate: false };
}

export async function dbInsertMember(member: Member): Promise<Member> {
  // Safety check before insertion to ensure NO duplicate enters DB
  const dupCheck = await dbCheckDuplicateMember({
    email: member.email,
    mobile: member.mobile,
    aadhaar_number: member.aadhaar_number,
    pan_number: member.pan_number,
  });
  if (dupCheck.isDuplicate) {
    throw new Error(dupCheck.message || "डुप्लीकेट सदस्य: यह विवरण पहले से पंजीकृत है।");
  }

  const col = await getCollection<Member>("members");
  if (col) {
    await col.insertOne(member as any);
    return member;
  }
  const store = getCleanStore();
  store.members.push(member);
  return member;
}

export async function dbUpdateMember(memberId: string, updates: Partial<Member>): Promise<void> {
  const col = await getCollection<Member>("members");
  if (col) {
    await col.updateOne(
      { _id: memberId } as any,
      { $set: { ...updates, updated_at: new Date().toISOString() } as any }
    );
    return;
  }
  const store = getCleanStore();
  const idx = store.members.findIndex((m) => m._id === memberId);
  if (idx !== -1) {
    store.members[idx] = { ...store.members[idx], ...updates, updated_at: new Date().toISOString() };
  }
}

export async function dbDeleteMember(memberId: string): Promise<boolean> {
  const col = await getCollection<Member>("members");
  if (col) {
    await col.deleteOne({ _id: memberId } as any);
    return true;
  }
  const store = getCleanStore();
  const idx = store.members.findIndex((m) => m._id === memberId);
  if (idx !== -1) {
    store.members.splice(idx, 1);
    return true;
  }
  return false;
}

// ==========================================
// DFI LOANS OPERATIONS
// ==========================================
export async function dbFindLoans(filter: Record<string, any> = {}): Promise<Loan[]> {
  const col = await getCollection<Loan>("loans");
  if (col) {
    return await col.find(filter).toArray();
  }
  const store = getCleanStore();
  return store.loans.filter((l) => {
    return Object.entries(filter).every(([k, v]) => (l as any)[k] === v);
  });
}

export async function dbFindLoanById(id: string): Promise<Loan | null> {
  const col = await getCollection<Loan>("loans");
  if (col) {
    return await col.findOne({ _id: id });
  }
  const store = getCleanStore();
  return store.loans.find((l) => l._id === id) || null;
}

export async function dbInsertLoan(loan: Loan): Promise<Loan> {
  const col = await getCollection<Loan>("loans");
  if (col) {
    await col.insertOne(loan as any);
    return loan;
  }
  const store = getCleanStore();
  store.loans.push(loan);
  return loan;
}

export async function dbUpdateLoan(loanId: string, updates: Partial<Loan>): Promise<void> {
  const col = await getCollection<Loan>("loans");
  if (col) {
    await col.updateOne({ _id: loanId } as any, { $set: updates as any });
    return;
  }
  const store = getCleanStore();
  const idx = store.loans.findIndex((l) => l._id === loanId);
  if (idx !== -1) {
    store.loans[idx] = { ...store.loans[idx], ...updates };
  }
}

// ==========================================
// DFI SYSTEM SETTINGS & DATE CONTROLS
// ==========================================
export async function dbGetSystemSettings(): Promise<SystemSettings> {
  const col = await getCollection<SystemSettings>("system_settings");
  if (col) {
    try {
      const doc = await col.findOne({ _id: "dfi_system_settings" });
      if (doc) return doc;
      await col.insertOne(DEFAULT_SYSTEM_SETTINGS as any);
      return DEFAULT_SYSTEM_SETTINGS;
    } catch (err) {
      console.warn("Astra DB get settings error, fallback to memory:", err);
    }
  }
  const store = getCleanStore();
  return store.settings || DEFAULT_SYSTEM_SETTINGS;
}

export async function dbUpdateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await dbGetSystemSettings();
  const updated: SystemSettings = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const col = await getCollection<SystemSettings>("system_settings");
  if (col) {
    try {
      await col.updateOne(
        { _id: "dfi_system_settings" } as any,
        { $set: updated as any },
        { upsert: true }
      );
    } catch (err) {
      console.warn("Astra DB update settings error, fallback to memory:", err);
    }
  }

  const store = getCleanStore();
  store.settings = updated;
  return updated;
}
