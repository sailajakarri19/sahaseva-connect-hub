import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  MapPin,
  MessageSquare,
  Navigation,
  Phone as PhoneIcon,
  ShieldCheck,
  Siren,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader, Pill } from "@/components/saha/shell";
import { inr, workers } from "@/lib/sahaseva-data";
import { useSession } from "@/lib/session";
import {
  acceptBooking,
  advanceBooking,
  bookingTotal,
  rejectBooking,
  useDB,
  type BookingRecord,
} from "@/lib/store";

export const Route = createFileRoute("/worker/jobs")({
  head: () => ({
    meta: [
      { title: "My jobs · SahaSeva Worker" },
      {
        name: "description",
        content:
          "Worker booking lifecycle: pending requests, upcoming bookings, active jobs with OTP start and completed history with earnings.",
      },
      { property: "og:title", content: "My jobs · SahaSeva Worker" },
      { property: "og:description", content: "Accept, start and complete cooperative service bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Jobs,
});

type Tab = "Pending" | "Upcoming" | "Active" | "Completed";

const ACTIVE = ["On The Way", "Arrived", "In Service"];

/** Deterministic 4-digit start code shared with the customer for this booking. */
export const otpFor = (id: string) =>
  String((Array.from(id).reduce((s, c) => s * 31 + c.charCodeAt(0), 7) % 9000) + 1000);

/** Masked demo contact line — cooperative numbers are never shown directly. */
const maskedPhone = (id: string) => `+91 98${otpFor(id)}0 ${otpFor(id + "x")}`;

const timeOfDay = (d: Date) =>
  d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

function countdown(startAt: number) {
  const now = new Date();
  const start = new Date(startAt);
  const diff = startAt - now.getTime();
  if (diff <= 0) return "Starting now";
  const mins = Math.round(diff / 60000);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayGap = Math.round((startDay - today) / 86_400_000);
  if (dayGap === 0) return mins < 60 ? `Starts in ${mins} min · today at ${timeOfDay(start)}` : `Today at ${timeOfDay(start)}`;
  if (dayGap === 1) return `Tomorrow at ${timeOfDay(start)}`;
  return `Starts in ${dayGap} days · ${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} at ${timeOfDay(start)}`;
}

function Jobs() {
  const { session } = useSession();
  const db = useDB();
  const [tab, setTab] = useState<Tab>("Pending");
  const [tick, setTick] = useState(0);

  const workerId = useMemo(
    () => workers.find((w) => w.name === session?.name)?.id ?? workers[0]!.id,
    [session?.name],
  );

  const mine = useMemo(
    () => db.bookings.filter((b) => b.workerId === workerId),
    [db.bookings, workerId],
  );

  // Re-render every 30s so countdowns stay live and due jobs auto-move.
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Accepted bookings whose start time has arrived move to Active automatically.
  useEffect(() => {
    for (const b of mine) {
      if (b.status === "Accepted" && b.startAt <= Date.now()) advanceBooking(b.id, "On The Way");
    }
  }, [mine, tick]);

  const groups: Record<Tab, BookingRecord[]> = {
    Pending: mine.filter((b) => b.status === "Pending"),
    Upcoming: mine.filter((b) => b.status === "Accepted"),
    Active: mine.filter((b) => ACTIVE.includes(b.status)),
    Completed: mine.filter((b) => b.status === "Completed"),
  };

  const list = [...groups[tab]].sort((a, b) => a.startAt - b.startAt);

  return (
    <>
      <AppHeader title="My jobs" subtitle="Requests move through the tabs as you act on them" />

      <div className="sticky top-[57px] z-10 grid grid-cols-4 gap-1 border-b bg-card px-3 py-2 text-[11px] font-bold">
        {(["Pending", "Upcoming", "Active", "Completed"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative rounded-full py-2 transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
            {t === "Pending" && groups.Pending.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] text-destructive-foreground">
                {groups.Pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3 p-4">
        {list.map((b) => (
          <JobCard key={b.id} b={b} tab={tab} />
        ))}
        {list.length === 0 && (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {tab === "Pending"
              ? "No new requests right now."
              : tab === "Completed"
                ? "No completed jobs yet."
                : `Nothing in ${tab.toLowerCase()}.`}
          </p>
        )}
      </div>
    </>
  );
}

function JobCard({ b, tab }: { b: BookingRecord; tab: Tab }) {
  const [otp, setOtp] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [details, setDetails] = useState(false);
  const total = bookingTotal(b);
  const startsAt = new Date(b.startAt);

  const start = () => {
    if (otp.trim() !== otpFor(b.id)) {
      toast.error("Wrong OTP. Ask the customer for the 4-digit start code.");
      return;
    }
    advanceBooking(b.id, "In Service");
    toast.success("Work started · status is now In Progress");
  };

  return (
    <article className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border bg-card p-4 shadow-card duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{b.subservice}</p>
          <p className="truncate text-xs text-muted-foreground">
            {b.customerName} · {b.id}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-extrabold">{inr(total)}</p>
          {b.emergency && (
            <Pill tone="danger">
              <Siren className="h-3 w-3" /> Emergency
            </Pill>
          )}
        </div>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />{" "}
        {startsAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {b.slot}
      </p>
      <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {b.address}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <PhoneIcon className="h-3.5 w-3.5" /> {b.customerPhone ?? maskedPhone(b.id)}
        <span className="text-[10px]">(masked line)</span>
      </p>
      {b.problem && <p className="mt-1 text-xs text-muted-foreground">“{b.problem}”</p>}

      {tab === "Pending" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              acceptBooking(b.id);
              toast.success("Accepted · moved to Upcoming");
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground"
          >
            <Check className="h-3.5 w-3.5" /> Accept
          </button>
          <button
            onClick={() => {
              rejectBooking(b.id);
              toast("Declined");
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-bold text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" /> Decline
          </button>
        </div>
      )}

      {tab === "Upcoming" && (
        <>
          <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground">
            {countdown(b.startAt)}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                advanceBooking(b.id, "On The Way");
                toast.success("Moved to Active");
              }}
              className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground"
            >
              Start work
            </button>
            <button
              onClick={() => setDetails((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            >
              {details ? "Hide details" : "View details"}
            </button>
            <button
              onClick={() => toast("Opening navigation")}
              aria-label="Navigate"
              className="flex items-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            >
              <Navigation className="h-3.5 w-3.5" />
            </button>
          </div>
          {details && (
            <dl className="mt-2 space-y-1 rounded-lg border bg-card p-3 text-xs">
              <Row k="Customer" v={b.customerName} />
              <Row k="Phone" v={b.customerPhone ?? maskedPhone(b.id)} />
              <Row k="Service" v={b.subservice} />
              <Row k="Date" v={startsAt.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })} />
              <Row k="Time" v={b.slot} />
              <Row k="Address" v={b.address} />
              <Row k="Amount" v={inr(total)} />
              <Row k="Start code" v={otpFor(b.id)} />
            </dl>
          )}
        </>
      )}

      {tab === "Active" && (
        <div className="mt-3 space-y-3 rounded-xl bg-secondary p-3">
          <Pill tone={b.status === "In Service" ? "success" : "primary"}>
            {b.status === "In Service" ? "In Progress" : b.status}
          </Pill>

          {b.status !== "In Service" ? (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-secondary-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> OTP verification to start work
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  placeholder="4-digit code"
                  className="w-32 rounded-lg border bg-card px-3 py-2 text-sm font-bold tracking-widest"
                />
                <button
                  onClick={start}
                  className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground"
                >
                  Verify & start
                </button>
              </div>
              <button
                onClick={() => setShowCode((v) => !v)}
                className="mt-1 text-[11px] font-semibold text-primary"
              >
                {showCode ? `Customer code: ${otpFor(b.id)}` : "Show demo code"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                advanceBooking(b.id, "Completed");
                toast.success(`Job completed · ${inr(total)} earned`);
              }}
              className="w-full rounded-lg bg-success py-2.5 text-xs font-bold text-success-foreground"
            >
              Mark as completed
            </button>
          )}

          <button
            onClick={() => toast("Connecting on the masked line")}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border bg-card py-2 text-xs font-bold"
          >
            <MessageSquare className="h-3.5 w-3.5" /> Contact customer
          </button>
        </div>
      )}

      {tab === "Completed" && (
        <div className="mt-3 flex items-center justify-between">
          <Pill tone="success">Completed</Pill>
          <span className="text-xs font-bold">Earned {inr(total)}</span>
        </div>
      )}
    </article>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  );
}
