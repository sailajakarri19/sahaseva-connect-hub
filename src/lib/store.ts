/**
 * SahaSeva centralized persistent data layer.
 *
 * Single source of truth for bookings, payments, messages, reviews and
 * notifications. Records are persisted to localStorage and broadcast to every
 * open view (customer + worker) through BroadcastChannel + storage events, so
 * status changes appear immediately without a refresh.
 *
 * The module is deliberately modular: `persist()` / `load()` are the only
 * storage touch points, so a hosted backend adapter can replace them later
 * without changing any screen.
 */
import { useCallback, useSyncExternalStore } from "react";
import { bookings as demoBookings, workers, type BookingStatus as LegacyStatus } from "./sahaseva-data";
import {
  dispatchToProviders,
  notificationService,
  type NotificationAudience,
  type NotificationDraft,
  type NotificationType,
} from "./notification-service";

export type LiveStatus =
  | "Pending"
  | "Accepted"
  | "On The Way"
  | "Arrived"
  | "In Service"
  | "Completed"
  | "Cancelled"
  | "Rejected";

export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded" | "Disputed";

export type PaymentMethod = "UPI" | "Card" | "Net Banking" | "Wallet" | "Cash after service";

export type Coords = { lat: number; lng: number; accuracy?: number };

export type TimelineEntry = { status: LiveStatus; at: number; note?: string };

export type BookingRecord = {
  id: string;
  createdAt: number;
  customerEmail: string;
  customerName: string;
  /** Contact number shown to the assigned worker (masked demo line). */
  customerPhone?: string;
  workerId: string;
  categoryId: string;
  subservice: string;
  problem: string;
  /** yyyy-mm-dd */
  date: string;
  /** Human label for the chosen window, e.g. "4–6 PM" or "5:30 PM". */
  slot: string;
  /** Exact start time as an epoch ms value. */
  startAt: number;
  address: string;
  coords?: Coords;
  locationSource: "manual" | "gps";
  distanceKm: number;
  emergency: boolean;
  recurring: string;
  status: LiveStatus;
  amount: number;
  materials: number;
  coopFee: number;
  platformFee: number;
  payment: PaymentStatus;
  paymentMethod?: PaymentMethod;
  txn?: string;
  paidAt?: number;
  demoPayment?: boolean;
  rating?: number;
  review?: string;
  timeline: TimelineEntry[];
};

export type MessageRecord = {
  id: string;
  bookingId: string;
  from: "customer" | "worker";
  text: string;
  at: number;
};

export type ReviewRecord = {
  id: string;
  bookingId: string;
  workerId: string;
  customerName: string;
  stars: number;
  comment: string;
  at: number;
};

export type NotificationRecord = {
  id: string;
  audience: NotificationAudience;
  /** customer email, worker id, or "admin" */
  target: string;
  type: NotificationType;
  title: string;
  body: string;
  tag: string;
  bookingId?: string;
  /** Stable key used to guarantee the same alert is never stored twice. */
  dedupeKey: string;
  at: number;
  read: boolean;
};


export type DB = {
  version: number;
  bookings: BookingRecord[];
  messages: MessageRecord[];
  reviews: ReviewRecord[];
  notifications: NotificationRecord[];
};

const KEY = "sahaseva.db.v4";
const CHANNEL = "sahaseva-db";

export const bookingTotal = (b: BookingRecord) =>
  b.amount + b.materials + b.coopFee + b.platformFee;

export const isActive = (s: LiveStatus) =>
  s === "On The Way" || s === "Arrived" || s === "In Service";

export const isUpcoming = (s: LiveStatus) => s === "Accepted" || isActive(s);

const legacyToLive = (s: LegacyStatus): LiveStatus => (s === "Requested" ? "Pending" : s);

function seed(): DB {
  const now = Date.now();
  const day = 86_400_000;
  const list: BookingRecord[] = demoBookings.map((b, i) => {
    const startAt =
      b.date === "Today" ? now + 2 * 3_600_000 : b.date === "Tomorrow" ? now + day : now - (i + 2) * day;
    const status = legacyToLive(b.status);
    return {
      id: b.id,
      createdAt: startAt - 3_600_000,
      customerEmail: b.customer === "Lakshmi Devi" ? "lakshmi@sahaseva.in" : "guest@sahaseva.in",
      customerName: b.customer,
      customerPhone: b.customer === "Lakshmi Devi" ? "+91 98490 12345" : "+91 90000 55221",
      workerId: b.workerId,
      categoryId: b.categoryId,
      subservice: b.subservice,
      problem: "",
      date: new Date(startAt).toISOString().slice(0, 10),
      slot: b.slot,
      startAt,
      address: b.address,
      locationSource: "manual",
      distanceKm: workers.find((w) => w.id === b.workerId)?.distanceKm ?? 0,
      emergency: Boolean(b.emergency),
      recurring: b.recurring ?? "One-time",
      status,
      amount: b.amount,
      materials: b.materials,
      coopFee: b.coopFee,
      platformFee: b.platformFee,
      payment: b.payment,
      ...(b.txn ? { txn: b.txn } : {}),
      ...(b.rating ? { rating: b.rating } : {}),
      timeline: [{ status, at: startAt - 3_600_000 }],
    };
  });

  // Fresh requests waiting on the demo worker (Ravi Kumar) so the full
  // Pending -> Upcoming -> Active -> Completed flow is demonstrable.
  const demoWorkerId = "SS-W-1042";
  const base = (over: Partial<BookingRecord>): BookingRecord => ({
    id: newBookingId(),
    createdAt: now - 10 * 60_000,
    customerEmail: "guest@sahaseva.in",
    customerName: "Customer",
    customerPhone: "+91 90000 00000",
    workerId: demoWorkerId,
    categoryId: "electrical",
    subservice: "Fan repair",
    problem: "",
    date: new Date(now).toISOString().slice(0, 10),
    slot: "4–6 PM",
    startAt: now + 2 * day,
    address: "Kondapur Village, Sangareddy",
    locationSource: "manual",
    distanceKm: 1.8,
    emergency: false,
    recurring: "One-time",
    status: "Pending",
    amount: 400,
    materials: 0,
    coopFee: 25,
    platformFee: 25,
    payment: "Pending",
    timeline: [{ status: "Pending", at: now - 10 * 60_000 }],
    ...over,
  });

  // Emergency demo request starts a few hours from now, with a matching label.
  const soonToday = now + 3 * 3_600_000;
  const soonHour = new Date(soonToday).getHours();
  const fmtHour = (h: number) =>
    `${((h + 11) % 12) + 1} ${h < 12 ? "AM" : "PM"}`;
  const soonSlot = `${fmtHour(soonHour)} – ${fmtHour((soonHour + 2) % 24)}`;

  const extras: BookingRecord[] = [
    base({
      customerEmail: "lakshmi@sahaseva.in",
      customerName: "Lakshmi Devi",
      customerPhone: "+91 98490 12345",
      subservice: "Inverter service",
      problem: "Inverter beeps and does not hold backup.",
      startAt: now + 2 * day,
      date: new Date(now + 2 * day).toISOString().slice(0, 10),
      slot: "10–12 PM",
      address: "H.No 4-21, Kondapur Village, Sangareddy",
      amount: 550,
      materials: 150,
    }),
    base({
      customerEmail: "guest@sahaseva.in",
      customerName: "Sunrise Clinic, Sangareddy",
      customerPhone: "+91 90000 55221",
      subservice: "Light installation",
      problem: "Two ceiling lights flickering in reception.",
      emergency: true,
      startAt: soonToday,
      date: new Date(soonToday).toISOString().slice(0, 10),
      slot: soonSlot,
      address: "Main Road, Sangareddy Town",
      amount: 700,
      materials: 200,
    }),
  ];

  return {
    version: 3,
    bookings: [...extras, ...list],
    messages: [],
    reviews: [],
    notifications: [],
  };
}

let db: DB | null = null;
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;

function load(): DB {
  if (typeof window === "undefined") return { version: 2, bookings: [], messages: [], reviews: [], notifications: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* corrupted storage -> reseed */
  }
  const fresh = seed();
  try {
    window.localStorage.setItem(KEY, JSON.stringify(fresh));
  } catch {
    /* storage unavailable: run in-memory */
  }
  return fresh;
}

function getDB(): DB {
  if (!db) db = load();
  return db;
}

function emit() {
  for (const l of listeners) l();
}

function persist(next: DB, broadcast = true) {
  db = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors, keep in-memory state */
    }
    if (broadcast) {
      if (!channel && "BroadcastChannel" in window) channel = new BroadcastChannel(CHANNEL);
      channel?.postMessage("sync");
    }
  }
  emit();
}

function update(fn: (current: DB) => DB) {
  persist(fn(getDB()));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") {
    if (!channel && "BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = () => {
        db = null;
        emit();
      };
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        db = null;
        emit();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => listeners.delete(cb);
}

const SERVER_SNAPSHOT: DB = { version: 2, bookings: [], messages: [], reviews: [], notifications: [] };

/** Live, realtime-synced view of the database. */
export function useDB(): DB {
  return useSyncExternalStore(subscribe, getDB, () => SERVER_SNAPSHOT);
}

export function useReset() {
  return useCallback(() => persist(seed()), []);
}

/* ---------------------------------------------------------------- helpers */

let counter = 0;
const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}${(counter++).toString(36).toUpperCase()}`;

export const newBookingId = () =>
  `SS-B-${Math.floor(100000 + Math.random() * 899999)}`;

/**
 * Persist notification drafts (in-app channel) and fan them out to the other
 * enabled providers. Drafts whose dedupeKey already exists are skipped, so a
 * repeated status change never produces a duplicate alert.
 */
function notify(current: DB, drafts: NotificationDraft[]): DB {
  const seen = new Set(current.notifications.map((n) => n.dedupeKey));
  const fresh = drafts.filter((d) => d.dedupeKey && !seen.has(d.dedupeKey));
  if (fresh.length === 0) return current;
  const rows: NotificationRecord[] = fresh.map((d) => ({
    ...d,
    id: uid("N"),
    at: Date.now(),
    read: false,
  }));
  for (const d of fresh) dispatchToProviders(d);
  return { ...current, notifications: [...rows.reverse(), ...current.notifications] };
}

const workerName = (workerId: string) =>
  workers.find((w) => w.id === workerId)?.name ?? "The worker";

function patch(
  current: DB,
  id: string,
  fn: (b: BookingRecord) => BookingRecord,
): DB {
  return { ...current, bookings: current.bookings.map((b) => (b.id === id ? fn(b) : b)) };
}

const withStep = (b: BookingRecord, status: LiveStatus, note?: string): BookingRecord => ({
  ...b,
  status,
  timeline: [...b.timeline, { status, at: Date.now(), ...(note ? { note } : {}) }],
});

/* ---------------------------------------------------------------- actions */

export type NewBookingInput = Omit<
  BookingRecord,
  "id" | "createdAt" | "status" | "timeline" | "payment"
> & { payment?: PaymentStatus };

/** Returns the created booking, or an error when the slot conflicts. */
export function createBooking(
  input: NewBookingInput,
): { booking: BookingRecord } | { error: string } {
  const current = getDB();
  const clash = current.bookings.find(
    (b) =>
      b.workerId === input.workerId &&
      b.date === input.date &&
      b.slot === input.slot &&
      !["Cancelled", "Rejected", "Completed"].includes(b.status),
  );
  if (clash) {
    return {
      error: `This worker already has a booking in the ${input.slot} window on that day. Please pick another slot or worker.`,
    };
  }
  const booking: BookingRecord = {
    ...input,
    payment: input.payment ?? "Pending",
    id: newBookingId(),
    createdAt: Date.now(),
    status: "Pending",
    timeline: [{ status: "Pending", at: Date.now() }],
  };
  let next: DB = { ...current, bookings: [booking, ...current.bookings] };
  next = notify(
    next,
    notificationService.sendBookingCreatedNotification(booking, {
      workerName: workerName(booking.workerId),
      total: bookingTotal(booking),
    }),
  );
  persist(next);
  return { booking };
}

export function acceptBooking(id: string) {
  update((current) => {
    const b = current.bookings.find((x) => x.id === id);
    if (!b || b.status !== "Pending") return current;
    const next = patch(current, id, (x) => withStep(x, "Accepted"));
    return notify(
      next,
      notificationService.sendBookingAcceptedNotification(b, {
        workerName: workerName(b.workerId),
      }),
    );
  });
}

export function rejectBooking(id: string, reason = "Worker is unavailable for this slot.") {
  update((current) => {
    const b = current.bookings.find((x) => x.id === id);
    if (!b || b.status === "Rejected") return current;
    const next = patch(current, id, (x) => withStep(x, "Rejected", reason));
    return notify(
      next,
      notificationService.sendBookingRejectedNotification(b, {
        workerName: workerName(b.workerId),
        reason,
      }),
    );
  });
}

export const workerSteps: LiveStatus[] = [
  "Accepted",
  "On The Way",
  "Arrived",
  "In Service",
  "Completed",
];

export function advanceBooking(id: string, to: LiveStatus) {
  update((current) => {
    const b = current.bookings.find((x) => x.id === id);
    if (!b || b.status === to) return current;
    const next = patch(current, id, (x) => withStep(x, to));
    const name = workerName(b.workerId);
    const drafts =
      to === "Completed"
        ? notificationService.sendBookingCompletedNotification(b, { workerName: name })
        : to === "In Service"
          ? notificationService.sendBookingStartedNotification(b, { workerName: name })
          : notificationService.sendBookingProgressNotification(b, {
              workerName: name,
              status: to,
            });
    return notify(next, drafts);
  });
}

export function cancelBooking(id: string, by: "customer" | "worker", reason = "") {
  update((current) => {
    const b = current.bookings.find((x) => x.id === id);
    if (!b || b.status === "Cancelled") return current;
    const next = patch(current, id, (x) =>
      withStep(
        { ...x, payment: x.payment === "Paid" ? "Refunded" : x.payment },
        "Cancelled",
        reason || `Cancelled by ${by}`,
      ),
    );
    return notify(
      next,
      notificationService.sendBookingCancelledNotification(b, {
        by,
        reason: reason || (b.payment === "Paid" ? "A refund has been initiated." : ""),
      }),
    );
  });
}

export function setPayment(
  id: string,
  payload: {
    status: PaymentStatus;
    method?: PaymentMethod;
    txn?: string;
    demo?: boolean;
  },
) {
  update((current) => {
    const b = current.bookings.find((x) => x.id === id);
    if (!b || b.payment === payload.status) return current;
    const next = patch(current, id, (x) => ({
      ...x,
      payment: payload.status,
      ...(payload.method ? { paymentMethod: payload.method } : {}),
      ...(payload.txn ? { txn: payload.txn } : {}),
      ...(payload.status === "Paid" ? { paidAt: Date.now() } : {}),
      ...(payload.demo !== undefined ? { demoPayment: payload.demo } : {}),
    }));
    return notify(
      next,
      notificationService.sendPaymentNotification(b, {
        status: payload.status,
        total: bookingTotal(b),
        ...(payload.method ? { method: payload.method } : {}),
      }),
    );
  });
}

/**
 * Reminder sweep for bookings starting soon. Safe to call on a timer: the
 * dedupe key keeps exactly one reminder per booking.
 */
export function runUpcomingReminders(windowMinutes = 60) {
  update((current) => {
    const now = Date.now();
    let next = current;
    for (const b of current.bookings) {
      if (!isUpcoming(b.status)) continue;
      const diff = b.startAt - now;
      if (diff <= 0 || diff > windowMinutes * 60_000) continue;
      next = notify(
        next,
        notificationService.sendUpcomingBookingNotification(b, {
          minutes: Math.max(1, Math.round(diff / 60_000)),
          workerName: workerName(b.workerId),
        }),
      );
    }
    return next;
  });
}

export function sendMessage(bookingId: string, from: "customer" | "worker", text: string) {
  update((current) => {
    const b = current.bookings.find((x) => x.id === bookingId);
    const at = Date.now();
    let next: DB = {
      ...current,
      messages: [...current.messages, { id: uid("M"), bookingId, from, text, at }],
    };
    if (b) next = notify(next, notificationService.sendMessageNotification(b, { from, text, at }));
    return next;
  });
}

export function addReview(bookingId: string, stars: number, comment: string) {
  update((current) => {
    const b = current.bookings.find((x) => x.id === bookingId);
    if (!b) return current;
    let next = patch(current, bookingId, (x) => ({ ...x, rating: stars, review: comment }));
    next = {
      ...next,
      reviews: [
        {
          id: uid("R"),
          bookingId,
          workerId: b.workerId,
          customerName: b.customerName,
          stars,
          comment,
          at: Date.now(),
        },
        ...next.reviews,
      ],
    };
    return notify(next, notificationService.sendRatingNotification(b, { stars, comment }));
  });
}

/* ---------------------------------------------------- notification centre */

/** Where the signed-in user's notifications are addressed. */
export type NotificationInbox = { audience: NotificationAudience; target: string };

export function inboxNotifications(db: DB, inbox: NotificationInbox | null) {
  if (!inbox) return [] as NotificationRecord[];
  return db.notifications
    .filter((n) => n.audience === inbox.audience && n.target === inbox.target)
    .sort((a, b) => b.at - a.at);
}

/** Live unread count for the bell badge. */
export function useUnreadCount(inbox: NotificationInbox | null) {
  const db = useDB();
  if (!inbox) return 0;
  return db.notifications.filter(
    (n) => n.audience === inbox.audience && n.target === inbox.target && !n.read,
  ).length;
}

export function useNotifications(inbox: NotificationInbox | null) {
  const db = useDB();
  return inboxNotifications(db, inbox);
}

export function markNotificationRead(id: string) {
  update((current) => ({
    ...current,
    notifications: current.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  }));
}

export function markNotificationsRead(audience: NotificationAudience, target: string) {
  update((current) => ({
    ...current,
    notifications: current.notifications.map((n) =>
      n.audience === audience && n.target === target && !n.read ? { ...n, read: true } : n,
    ),
  }));
}

export function clearNotifications(audience: NotificationAudience, target: string) {
  update((current) => ({
    ...current,
    notifications: current.notifications.filter(
      (n) => !(n.audience === audience && n.target === target),
    ),
  }));
}


/** Worker rating recalculated from the base profile plus live reviews. */
export function workerRating(workerId: string, reviews: ReviewRecord[]) {
  const base = workers.find((w) => w.id === workerId);
  if (!base) return { rating: 0, count: 0 };
  const mine = reviews.filter((r) => r.workerId === workerId);
  if (mine.length === 0) return { rating: base.rating, count: base.jobs };
  const total = base.rating * base.jobs + mine.reduce((s, r) => s + r.stars, 0);
  const count = base.jobs + mine.length;
  return { rating: Math.round((total / count) * 10) / 10, count };
}
