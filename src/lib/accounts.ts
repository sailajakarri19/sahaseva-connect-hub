/**
 * Local account registry for SahaSeva registration + admin verification.
 *
 * Customers are APPROVED on signup; cooperative workers are created as
 * PENDING and can only sign in once an Admin approves them.
 */
import { useCallback, useSyncExternalStore } from "react";
import { demoAccounts, type Role } from "./sahaseva-data";

export type AccountStatus = "APPROVED" | "PENDING" | "REJECTED";

export type Address = {
  state: string;
  district: string;
  mandal: string;
  village: string;
  pincode: string;
  landmark: string;
};

export type WorkerDetails = {
  skills: string;
  experience: string;
  certificates: string;
  society: string;
  membershipId: string;
  kyc: string;
  availabilityDays: string;
  availabilityTime: string;
  payout: string;
};

export type Account = {
  email: string;
  password: string;
  name: string;
  mobile: string;
  role: Exclude<Role, "ADMIN">;
  language: string;
  address: Address;
  status: AccountStatus;
  rejectionReason?: string;
  createdAt: number;
  worker?: WorkerDetails;
};

const KEY = "sahaseva.accounts";
const EVENT = "sahaseva-accounts";

let cache: Account[] | null = null;

function readRaw(): Account[] {
  if (typeof window === "undefined") return [];
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Account[]) {
  cache = next;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function listAccounts(): Account[] {
  return readRaw();
}

export function findAccount(email: string): Account | undefined {
  const e = email.trim().toLowerCase();
  return readRaw().find((a) => a.email.toLowerCase() === e);
}

export function registerAccount(
  input: Omit<Account, "status" | "createdAt">,
): { ok: true; account: Account } | { error: string } {
  const email = input.email.trim().toLowerCase();
  if (demoAccounts.some((d) => d.email.toLowerCase() === email) || findAccount(email)) {
    return { error: "An account with this email already exists." };
  }
  const account: Account = {
    ...input,
    email,
    status: input.role === "CUSTOMER" ? "APPROVED" : "PENDING",
    createdAt: Date.now(),
  };
  write([account, ...readRaw()]);
  return { ok: true, account };
}

export function setAccountStatus(email: string, status: AccountStatus, reason?: string) {
  const e = email.toLowerCase();
  write(
    readRaw().map((a) => {
      if (a.email.toLowerCase() !== e) return a;
      const { rejectionReason: _drop, ...rest } = a;
      return reason ? { ...rest, status, rejectionReason: reason } : { ...rest, status };
    }),
  );
}

function subscribe(cb: () => void) {
  const handler = () => {
    cache = null;
    cb();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

const EMPTY: Account[] = [];

export function useAccounts() {
  const accounts = useSyncExternalStore(
    subscribe,
    useCallback(() => readRaw(), []),
    useCallback(() => EMPTY, []),
  );
  return accounts;
}
