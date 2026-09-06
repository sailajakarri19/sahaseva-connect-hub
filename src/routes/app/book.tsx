import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  LocateFixed,
  MapPin,
  Repeat,
  Scale,
  ShieldCheck,
  Siren,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader, Pill } from "@/components/saha/shell";
import { InvoiceSheet } from "@/components/saha/invoice";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { categories, fairWage, inr, workers } from "@/lib/sahaseva-data";
import {
  SLOTS,
  customStartAt,
  dayLabel,
  fullDateLabel,
  isSameDay,
  slotAvailable,
  slotStartAt,
  startOfDay,
  timeLabel,
  toDateKey,
} from "@/lib/booking-time";
import { useGeolocation, formatCoords } from "@/lib/geo";
import { getPaymentConfig, type PaymentConfig } from "@/lib/payments.functions";
import {
  bookingTotal,
  createBooking,
  setPayment,
  useDB,
  workerRating,
  type BookingRecord,
  type PaymentMethod,
} from "@/lib/store";
import { useSession } from "@/lib/session";

const search = z.object({
  category: z.string().optional(),
  sub: z.string().optional(),
  worker: z.string().optional(),
  emergency: z.boolean().optional(),
});

export const Route = createFileRoute("/app/book")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Book a service · SahaSeva" },
      {
        name: "description",
        content:
          "Pick a service, a verified cooperative worker, a real date and time, your location, transparent pricing and payment before you confirm.",
      },
      { property: "og:title", content: "Book a service · SahaSeva" },
      { property: "og:description", content: "Transparent, fair-wage booking in a few steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Book,
});

const recurrences = ["One-time", "Weekly", "Biweekly", "Monthly"];

const methods: { id: PaymentMethod; hint: string }[] = [
  { id: "UPI", hint: "GPay, PhonePe, Paytm, BHIM" },
  { id: "Card", hint: "Debit or credit card" },
  { id: "Net Banking", hint: "All major Indian banks" },
  { id: "Wallet", hint: "Paytm / Amazon Pay wallet" },
  { id: "Cash after service", hint: "Pay the worker after the job" },
];

function Book() {
  const { category, sub, worker: presetWorker, emergency: presetEmergency } = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useSession();
  const db = useDB();
  const geo = useGeolocation();

  const [catId, setCatId] = useState(category ?? "");
  const [subName, setSubName] = useState(sub ?? "");
  const [workerId, setWorkerId] = useState(presetWorker ?? "");
  const [problem, setProblem] = useState("");
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [slotLabel, setSlotLabel] = useState<string>("");
  const [useCustom, setUseCustom] = useState(false);
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");
  const [recurring, setRecurring] = useState("One-time");
  const [address, setAddress] = useState("");
  const [emergency, setEmergency] = useState(Boolean(presetEmergency));
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [payConfig, setPayConfig] = useState<PaymentConfig | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    let alive = true;
    getPaymentConfig()
      .then((c) => alive && setPayConfig(c))
      .catch(() =>
        alive &&
        setPayConfig({
          configured: false,
          provider: "razorpay",
          message:
            "Payment service could not be reached. Demo Payment Mode is active — no money will move.",
        }),
      );
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (geo.address) setAddress(geo.address);
  }, [geo.address]);

  const cat = categories.find((c) => c.id === catId);
  const subservice = cat?.subservices.find((s) => s.name === subName);

  /** Match on category + skill + verification + availability, then distance and rating. */
  const candidates = useMemo(() => {
    if (!catId) return [];
    return workers
      .filter((w) => w.categoryId === catId && w.status === "Verified")
      .map((w) => ({
        w,
        skillMatch: subName ? w.skills.some((s) => s.toLowerCase() === subName.toLowerCase()) : false,
        live: workerRating(w.id, db.reviews),
      }))
      .sort((a, b) => {
        if (a.skillMatch !== b.skillMatch) return a.skillMatch ? -1 : 1;
        if (a.w.availableNow !== b.w.availableNow) return a.w.availableNow ? -1 : 1;
        if (a.w.distanceKm !== b.w.distanceKm) return a.w.distanceKm - b.w.distanceKm;
        return b.live.rating - a.live.rating;
      });
  }, [catId, subName, db.reviews]);

  const worker = workers.find((w) => w.id === workerId);
  const workerBusy = useMemo(
    () =>
      db.bookings.some(
        (b) =>
          b.workerId === workerId &&
          b.date === toDateKey(date) &&
          b.slot === (useCustom ? timeLabel(hour, minute, meridiem) : slotLabel) &&
          !["Cancelled", "Rejected", "Completed"].includes(b.status),
      ),
    [db.bookings, workerId, date, slotLabel, useCustom, hour, minute, meridiem],
  );

  const serviceCharge = subservice?.base ?? 0;
  const materials = subservice ? Math.round(subservice.base * 0.25) : 0;
  const coopFee = Math.round(serviceCharge * 0.07);
  const platformFee = Math.round(serviceCharge * 0.05) + (emergency ? 60 : 0);
  const total = serviceCharge + materials + coopFee + platformFee;
  const wage = subservice ? fairWage(serviceCharge, subservice.range) : null;

  const chosenLabel = useCustom ? timeLabel(hour, minute, meridiem) : slotLabel;
  const startAt = useCustom
    ? customStartAt(date, hour, minute, meridiem)
    : SLOTS.find((s) => s.label === slotLabel)
      ? slotStartAt(date, SLOTS.find((s) => s.label === slotLabel)!)
      : 0;
  const timeInPast = startAt > 0 && startAt < Date.now();

  const booking = doneId ? db.bookings.find((b) => b.id === doneId) : undefined;

  async function confirm() {
    setError(null);
    if (!session) return;
    if (!subservice || !worker) return setError("Please choose a service and a worker.");
    if (!chosenLabel || startAt === 0) return setError("Please choose a date and a time slot.");
    if (timeInPast)
      return setError("That time has already passed. Please choose a later time today or another day.");
    if (!address.trim())
      return setError("Please add the service address so the worker can reach you.");

    const created = createBooking({
      customerEmail: session.email,
      customerName: session.name,
      workerId: worker.id,
      categoryId: worker.categoryId,
      subservice: subservice.name,
      problem: problem.trim(),
      date: toDateKey(date),
      slot: chosenLabel,
      startAt,
      address: address.trim(),
      ...(geo.coords ? { coords: geo.coords } : {}),
      locationSource: geo.coords ? "gps" : "manual",
      distanceKm: worker.distanceKm,
      emergency,
      recurring,
      amount: serviceCharge,
      materials,
      coopFee,
      platformFee,
    });

    if ("error" in created) {
      setError(created.error);
      toast.error("Booking conflict");
      return;
    }

    if (method !== "Cash after service") {
      setPaying(true);
      try {
        await new Promise((r) => setTimeout(r, 900));
        setPayment(created.booking.id, {
          status: "Paid",
          method,
          txn: `TXN-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          demo: !payConfig?.configured,
        });
        toast.success(payConfig?.configured ? "Payment successful" : "Demo payment successful");
      } catch {
        setPayment(created.booking.id, { status: "Failed", method });
        toast.error("Payment failed — you can retry from My bookings.");
      } finally {
        setPaying(false);
      }
    } else {
      setPayment(created.booking.id, { status: "Pending", method });
    }

    setDoneId(created.booking.id);
    toast.success(`Booking ${created.booking.id} requested`);
  }

  if (!session) {
    return (
      <>
        <AppHeader title="Book a service" />
        <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">
          Loading your account…
        </div>
      </>
    );
  }

  if (booking) return <Success b={booking} showInvoice={showInvoice} setShowInvoice={setShowInvoice} />;

  return (
    <>
      <AppHeader
        title="Book a service"
        subtitle="Transparent pricing · fair wages"
        right={
          <button
            onClick={() => navigate({ to: "/app" })}
            className="grid h-9 w-9 place-items-center rounded-full border bg-background"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        }
      />

      <div className="space-y-4 p-4">
        <Card title="1 · Select service">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Chip
                key={c.id}
                active={catId === c.id}
                onClick={() => {
                  setCatId(c.id);
                  setSubName("");
                  setWorkerId("");
                }}
              >
                {c.name}
              </Chip>
            ))}
          </div>
        </Card>

        {cat && (
          <Card title="2 · Select subservice">
            <div className="space-y-2">
              {cat.subservices.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setSubName(s.name)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm ${
                    subName === s.name ? "border-primary bg-secondary" : "bg-background"
                  }`}
                >
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {inr(s.range[0])} – {inr(s.range[1])}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {subservice && (
          <>
            <Card title="3 · Select a verified worker">
              {candidates.length === 0 ? (
                <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No verified cooperative worker is listed for this service yet. Please try another
                  service or contact your society office.
                </p>
              ) : (
                <div className="space-y-2">
                  {candidates.map(({ w, skillMatch, live }) => (
                    <button
                      key={w.id}
                      onClick={() => setWorkerId(w.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left ${
                        workerId === w.id ? "border-primary bg-secondary" : "bg-background"
                      }`}
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold text-primary-foreground"
                        style={{ backgroundColor: w.photoTint }}
                      >
                        {w.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 text-sm font-bold">
                          {w.name} <BadgeCheck className="h-3.5 w-3.5 text-success" />
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          <Star className="mr-1 inline h-3 w-3 fill-accent text-accent" />
                          {live.rating} · {w.distanceKm} km · ETA {w.etaMin} min · {w.radiusKm} km radius
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {skillMatch ? `Skilled in ${subName}` : w.skills.slice(0, 2).join(", ")} · {w.society}
                        </span>
                      </span>
                      {w.availableNow ? <Pill tone="success">Available now</Pill> : <Pill>Busy</Pill>}
                    </button>
                  ))}
                  <p className="text-[11px] text-muted-foreground">
                    Distances are from each worker's registered service area, not live GPS tracking.
                  </p>
                </div>
              )}
            </Card>

            <Card title="4 · Describe the problem">
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={3}
                placeholder="E.g. kitchen tap has been dripping since yesterday"
                className="w-full rounded-xl border bg-background p-3 text-sm outline-none"
              />
              <button className="mt-2 flex items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-xs font-semibold text-muted-foreground">
                <Camera className="h-4 w-4" /> Add photo or video (optional)
              </button>
              <label className="mt-3 flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={emergency}
                  onChange={(e) => setEmergency(e.target.checked)}
                  className="h-4 w-4 accent-[var(--destructive)]"
                />
                <Siren className="h-4 w-4 text-destructive" />
                Mark as emergency (prioritised, ₹60 urgent visit fee)
              </label>
            </Card>

            <Card title="5 · Date & time">
              <div className="flex flex-wrap gap-2">
                {[0, 1].map((offset) => {
                  const d = startOfDay(new Date(Date.now() + offset * 86_400_000));
                  return (
                    <Chip key={offset} active={isSameDay(date, d)} onClick={() => setDate(d)}>
                      <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                      {dayLabel(d)}
                    </Chip>
                  );
                })}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button className="rounded-full border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                      Pick date
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (!d) return;
                        setDate(startOfDay(d));
                        setCalendarOpen(false);
                      }}
                      disabled={{ before: startOfDay(new Date()) }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <p className="mt-2 text-xs font-semibold text-primary">{fullDateLabel(date)}</p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {SLOTS.map((s) => {
                  const ok = slotAvailable(date, s);
                  const active = !useCustom && slotLabel === s.label;
                  return (
                    <button
                      key={s.label}
                      disabled={!ok}
                      onClick={() => {
                        setUseCustom(false);
                        setSlotLabel(s.label);
                      }}
                      className={`rounded-full border px-2 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground"
                      } ${ok ? "" : "cursor-not-allowed opacity-40"}`}
                    >
                      <Clock className="mr-1 inline h-3.5 w-3.5" />
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setUseCustom((v) => !v)}
                className="mt-3 text-xs font-bold text-primary"
              >
                {useCustom ? "Use a standard slot instead" : "Choose a custom time"}
              </button>

              {useCustom && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    value={hour}
                    onChange={(e) => setHour(Number(e.target.value))}
                    className="rounded-lg border bg-background px-2 py-2 text-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span className="font-bold">:</span>
                  <select
                    value={minute}
                    onChange={(e) => setMinute(Number(e.target.value))}
                    className="rounded-lg border bg-background px-2 py-2 text-sm"
                  >
                    {[0, 15, 30, 45].map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    {(["AM", "PM"] as const).map((m) => (
                      <Chip key={m} active={meridiem === m} onClick={() => setMeridiem(m)}>
                        {m}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {chosenLabel && (
                <p className="mt-3 rounded-xl bg-secondary p-2.5 text-xs font-semibold text-secondary-foreground">
                  Selected: {fullDateLabel(date)} · {chosenLabel}
                </p>
              )}
              {timeInPast && (
                <Warn>That time has already passed. Please choose a later time.</Warn>
              )}
              {workerBusy && (
                <Warn>
                  {worker?.name} already has a booking in this window. Please pick another slot or
                  worker.
                </Warn>
              )}

              <div className="mt-3">
                <p className="mb-1.5 flex items-center gap-1 text-xs font-bold text-muted-foreground">
                  <Repeat className="h-3.5 w-3.5" /> Repeat booking
                </p>
                <div className="flex flex-wrap gap-2">
                  {recurrences.map((r) => (
                    <Chip key={r} active={recurring === r} onClick={() => setRecurring(r)}>
                      {r}
                    </Chip>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="6 · Service location">
              <label className="flex items-start gap-2 rounded-xl border bg-background p-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="House number, street, village / town, district, PIN"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </label>

              <button
                onClick={geo.detect}
                disabled={geo.loading}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold text-primary disabled:opacity-60"
              >
                {geo.loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="h-3.5 w-3.5" />
                )}
                {geo.loading ? "Getting your location…" : "Use my current location"}
              </button>

              {geo.error && <Warn>{geo.error}</Warn>}
              {geo.coords && (
                <div className="mt-2 rounded-xl bg-success/10 p-3 text-xs text-success">
                  <p className="font-bold">Location confirmed</p>
                  <p className="mt-0.5">Coordinates {formatCoords(geo.coords)} (±{geo.coords.accuracy ?? "?"} m)</p>
                  {geo.address && <p className="mt-0.5">{geo.address}</p>}
                </div>
              )}
              {geo.note && <p className="mt-2 text-[11px] text-muted-foreground">{geo.note}</p>}
              {!geo.coords && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Your location is only read from your device when you tap the button — it is never
                  guessed or simulated.
                </p>
              )}
            </Card>

            <Card title="7 · Transparent price">
              <Row label="Service charge" value={inr(serviceCharge)} />
              <Row label="Estimated materials" value={inr(materials)} />
              <Row label="Cooperative fee (7%)" value={inr(coopFee)} />
              <Row label={`Platform fee${emergency ? " + urgent visit" : ""}`} value={inr(platformFee)} />
              <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm font-extrabold">
                <span>Estimated total</span>
                <span>{inr(total)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Estimated range {inr(subservice.range[0])} – {inr(subservice.range[1])}. Final amount
                may vary with actual work and materials. No hidden fees.
              </p>
              {wage && (
                <div
                  className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-xs font-medium ${
                    wage.ok ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground"
                  }`}
                >
                  <Scale className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <b>Fair Wage Check:</b> {wage.text}
                  </span>
                </div>
              )}
              <p className="mt-3 rounded-xl bg-muted p-3 text-[11px] text-muted-foreground">
                Cancellation policy: free cancellation up to 2 hours before the slot. Later
                cancellations may carry a ₹50 visit-protection charge paid to the worker.
              </p>
            </Card>

            <Card title="8 · Payment">
              {payConfig && !payConfig.configured && (
                <div className="mb-3 flex items-start gap-2 rounded-xl bg-warning/15 p-3 text-xs font-semibold text-warning-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Demo Payment Mode · {payConfig.message}</span>
                </div>
              )}
              <div className="space-y-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left ${
                      method === m.id ? "border-primary bg-secondary" : "bg-background"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{m.id}</span>
                      <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
                    </span>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Card numbers, CVVs and bank credentials are handled by the payment gateway only —
                SahaSeva never stores them.
              </p>
            </Card>

            {error && <Warn>{error}</Warn>}

            <button
              disabled={!workerId || !chosenLabel || paying || workerBusy || timeInPast}
              onClick={confirm}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-card disabled:opacity-40"
            >
              {paying ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing payment…
                </span>
              ) : !workerId ? (
                "Select a worker to continue"
              ) : !chosenLabel ? (
                "Select a date and time"
              ) : (
                `Confirm booking · ${inr(total)}`
              )}
            </button>
          </>
        )}
      </div>
    </>
  );
}

function Success({
  b,
  showInvoice,
  setShowInvoice,
}: {
  b: BookingRecord;
  showInvoice: boolean;
  setShowInvoice: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const worker = workers.find((w) => w.id === b.workerId);
  return (
    <>
      <AppHeader title="Booking confirmed" subtitle={`${b.subservice} · ${b.slot}`} />
      <div className="space-y-4 p-4">
        <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <p className="mt-3 text-lg font-extrabold">Booking {b.id} is pending</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {worker?.name} has received your request and will accept it shortly. You will be notified
            the moment the status changes.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Pill tone="warning">{b.status}</Pill>
            <Pill tone={b.payment === "Paid" ? "success" : "muted"}>Payment {b.payment}</Pill>
            {b.emergency && <Pill tone="danger">Emergency</Pill>}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 text-sm shadow-card">
          <Row label="Scheduled" value={`${new Date(b.startAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} · ${b.slot}`} />
          <Row label="Address" value={b.address} />
          <Row label="Total" value={inr(bookingTotal(b))} />
          <Row label="Transaction" value={b.txn ?? "—"} />
        </div>

        <button
          onClick={() => setShowInvoice(true)}
          className="w-full rounded-xl border py-3 text-sm font-bold"
        >
          View invoice
        </button>
        <button
          onClick={() => navigate({ to: "/app/bookings" })}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
        >
          Go to my bookings
        </button>
      </div>
      {showInvoice && <InvoiceSheet b={b} onClose={() => setShowInvoice(false)} />}
    </>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card">
      <h2 className="mb-3 text-sm font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
