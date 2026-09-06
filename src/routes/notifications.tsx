import { useMemo } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, BellOff, CheckCheck } from "lucide-react";
import { Phone, AppHeader, Pill } from "@/components/saha/shell";
import { useSession } from "@/lib/session";
import { useInbox, useNotificationRuntime } from "@/lib/notification-inbox";
import {
  clearNotifications,
  markNotificationRead,
  markNotificationsRead,
  useDB,
  useNotifications,
  type NotificationRecord,
} from "@/lib/store";
import { workers } from "@/lib/sahaseva-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · SahaSeva" },
      {
        name: "description",
        content:
          "Live booking, payment and service alerts for SahaSeva customers, workers and admins.",
      },
      { property: "og:title", content: "Notifications · SahaSeva" },
      { property: "og:description", content: "Role-aware notification centre with live updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Notifications,
});

const toneFor = (tag: string) =>
  tag === "Emergency"
    ? "danger"
    : tag === "Payment"
      ? "success"
      : tag === "Job"
        ? "primary"
        : tag === "Rating"
          ? "accent"
          : "muted";

function timeAgo(at: number) {
  const s = Math.max(1, Math.round((Date.now() - at) / 1000));
  if (s < 60) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d} d ago`;
}

const stamp = (at: number) =>
  new Date(at).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function Notifications() {
  const { session } = useSession();
  const router = useRouter();
  const navigate = useNavigate();
  const inbox = useInbox();
  const db = useDB();
  const items = useNotifications(inbox);
  useNotificationRuntime();

  const unread = items.filter((n) => !n.read).length;
  const { fresh, earlier } = useMemo(
    () => ({
      fresh: items.filter((n) => !n.read),
      earlier: items.filter((n) => n.read),
    }),
    [items],
  );

  const open = (n: NotificationRecord) => {
    markNotificationRead(n.id);
    if (!n.bookingId) return;
    if (session?.role === "WORKER") navigate({ to: "/worker/jobs" });
    else if (session?.role === "ADMIN") navigate({ to: "/admin" });
    else navigate({ to: "/app/bookings" });
  };

  const Row = ({ n }: { n: NotificationRecord }) => {
    const booking = db.bookings.find((b) => b.id === n.bookingId);
    const worker = booking ? workers.find((w) => w.id === booking.workerId) : undefined;
    return (
      <button
        onClick={() => open(n)}
        className={`w-full rounded-2xl border p-3 text-left transition-colors hover:bg-muted/60 ${
          n.read ? "bg-card" : "border-primary/40 bg-secondary/50"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold">{n.title}</p>
          <Pill tone={toneFor(n.tag)}>{n.tag}</Pill>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
        {booking && (
          <p className="mt-1 text-[11px] font-semibold text-primary">
            {booking.id} · {booking.subservice}
            {worker ? ` · ${worker.name}` : ""} · {booking.status}
          </p>
        )}
        <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{timeAgo(n.at)}</span>
          <span>·</span>
          <span>{stamp(n.at)}</span>
          {!n.read && <span className="font-bold text-primary">· Unread</span>}
        </p>
      </button>
    );
  };

  return (
    <Phone>
      <AppHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "You are all caught up"}
        right={
          <button
            onClick={() => router.history.back()}
            aria-label="Go back"
            className="grid h-9 w-9 place-items-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        }
      />

      <div className="space-y-4 p-4">
        {inbox && items.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => markNotificationsRead(inbox.audience, inbox.target)}
              className="flex flex-1 items-center justify-center gap-1 rounded-full border px-3 py-2 text-xs font-bold"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
            <button
              onClick={() => clearNotifications(inbox.audience, inbox.target)}
              className="flex flex-1 items-center justify-center gap-1 rounded-full border px-3 py-2 text-xs font-bold text-muted-foreground"
            >
              <BellOff className="h-3.5 w-3.5" /> Clear history
            </button>
          </div>
        )}

        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No notifications yet. Booking, service and payment updates will appear here
            automatically.
          </p>
        )}

        {fresh.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              New
            </h2>
            {fresh.map((n) => (
              <Row key={n.id} n={n} />
            ))}
          </section>
        )}

        {earlier.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Earlier
            </h2>
            {earlier.map((n) => (
              <Row key={n.id} n={n} />
            ))}
          </section>
        )}
      </div>
    </Phone>
  );
}
