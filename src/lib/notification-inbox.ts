import { useEffect, useMemo } from "react";
import { workers } from "./sahaseva-data";
import { useSession } from "./session";
import { runUpcomingReminders, type NotificationInbox } from "./store";
import { requestPushPermission } from "./notification-service";

/**
 * Resolves the signed-in user's notification inbox address
 * (customer -> email, worker -> worker id, admin -> "admin").
 */
export function useInbox(): NotificationInbox | null {
  const { session } = useSession();

  return useMemo(() => {
    if (!session) return null;
    if (session.role === "WORKER") {
      const id = workers.find((w) => w.name === session.name)?.id ?? workers[0]!.id;
      return { audience: "worker", target: id };
    }
    if (session.role === "ADMIN") return { audience: "admin", target: "admin" };
    return { audience: "customer", target: session.email };
  }, [session]);
}

/**
 * Background notification runtime: asks once for browser notification
 * permission and sweeps for bookings that are about to start.
 */
export function useNotificationRuntime() {
  useEffect(() => {
    void requestPushPermission();
    runUpcomingReminders();
    const t = setInterval(() => runUpcomingReminders(), 60_000);
    return () => clearInterval(t);
  }, []);
}
