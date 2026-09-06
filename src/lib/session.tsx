import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { demoAccounts, roleHome, type DemoAccount, type Role } from "./sahaseva-data";
import { findAccount } from "./accounts";

const KEY = "sahaseva.session";

export type Session = Omit<DemoAccount, "password"> & { verified?: boolean };

function read(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function store(session: Session) {
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("sahaseva-session"));
  return session;
}

export function signIn(email: string, password: string): Session | { error: string } {
  const clean = email.trim().toLowerCase();

  const demo = demoAccounts.find((a) => a.email.toLowerCase() === clean);
  if (demo) {
    if (demo.password !== password) return { error: "Incorrect password." };
    const { password: _pw, ...session } = demo;
    return store(session);
  }

  const acc = findAccount(clean);
  if (!acc) return { error: "No account found with that email." };
  if (acc.password !== password) return { error: "Incorrect password." };

  if (acc.status === "PENDING") {
    return {
      error:
        "Your profile is under verification by Admin. You will be able to login after Admin approval. Please wait.",
    };
  }
  if (acc.status === "REJECTED") {
    return {
      error: `Your registration was rejected by Admin. Reason: ${
        acc.rejectionReason ?? "Not specified"
      }. Please re-submit your documents.`,
    };
  }

  return store({
    email: acc.email,
    name: acc.name,
    role: acc.role,
    org: acc.worker?.society ?? "SahaSeva customer",
    location: `${acc.address.village}, ${acc.address.district}`,
    verified: true,
  });
}

export function signOut() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("sahaseva-session"));
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(read());
    sync();
    setReady(true);
    window.addEventListener("sahaseva-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("sahaseva-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { session, ready };
}

/** Client-side route guard: redirects to /auth or to the correct role home. */
export function useRequireRole(role: Role) {
  const { session, ready } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      navigate({ to: "/auth" });
    } else if (session.role !== role) {
      navigate({ to: roleHome[session.role] });
    }
  }, [ready, session, role, navigate]);

  return session && session.role === role ? session : null;
}

export function useSignOut() {
  const navigate = useNavigate();
  return useCallback(() => {
    signOut();
    navigate({ to: "/auth" });
  }, [navigate]);
}
