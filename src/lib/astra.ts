import { DataAPIClient, Db } from "@datastax/astra-db-ts";
import { User, FundGroup, GroupMember, Contribution, WithdrawalRequest, Vote, PayoutDisbursal } from "./types";

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
    groups: FundGroup[];
    group_members: GroupMember[];
    contributions: Contribution[];
    withdrawal_requests: WithdrawalRequest[];
    votes: Vote[];
    payouts: PayoutDisbursal[];
  } | undefined;
}

export function getCleanStore() {
  if (!global.__bbcc_clean_store) {
    global.__bbcc_clean_store = {
      users: [],
      groups: [],
      group_members: [],
      contributions: [],
      withdrawal_requests: [],
      votes: [],
      payouts: [],
    };
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
