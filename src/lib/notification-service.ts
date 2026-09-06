/**
 * SahaSeva notification service.
 *
 * UI-free, storage-free layer that turns booking/payment events into
 * notification drafts and fans them out to pluggable providers.
 *
 * Providers:
 *   - InAppProvider        (always on; persisted by the data layer)
 *   - BrowserPushProvider  (free Web Notifications API, needs permission)
 *   - SMSProvider          (stub, disabled — paid gateway can be added later)
 *   - WhatsAppProvider     (stub, disabled — paid gateway can be added later)
 *
 * Nothing here imports the store at runtime, so the data layer can import this
 * module freely and a hosted backend can reuse the same templates.
 */

export type NotificationAudience = "customer" | "worker" | "admin";

export type NotificationType =
  | "booking_created"
  | "booking_requested"
  | "booking_accepted"
  | "booking_rejected"
  | "booking_started"
  | "booking_progress"
  | "booking_completed"
  | "booking_cancelled"
  | "booking_upcoming"
  | "emergency_created"
  | "emergency_assigned"
  | "payment_status"
  | "message"
  | "rating";

export type NotificationDraft = {
  audience: NotificationAudience;
  /** customer email, worker id, or "admin" */
  target: string;
  type: NotificationType;
  title: string;
  body: string;
  tag: string;
  bookingId?: string;
  /** Stable key: the same key is never delivered twice. */
  dedupeKey: string;
};

/** Minimal booking shape the templates need (kept structural on purpose). */
export type BookingLike = {
  id: string;
  customerEmail: string;
  customerName: string;
  workerId: string;
  subservice: string;
  emergency: boolean;
  distanceKm: number;
  slot: string;
  date: string;
  startAt: number;
};

/* ------------------------------------------------------------- providers */

export interface NotificationProvider {
  id: string;
  label: string;
  isEnabled(): boolean;
  deliver(draft: NotificationDraft): void | Promise<void>;
}

/**
 * In-app provider. Delivery is the persisted notification row itself, written
 * by the data layer, so this provider only marks the channel as active.
 */
export const InAppProvider: NotificationProvider = {
  id: "in-app",
  label: "In-app notification centre",
  isEnabled: () => true,
  deliver: () => {},
};

export const BrowserPushProvider: NotificationProvider = {
  id: "browser-push",
  label: "Browser notifications",
  isEnabled: () =>
    typeof window !== "undefined" &&
    "Notification" in window &&
    window.Notification.permission === "granted",
  deliver: (draft) => {
    try {
      new window.Notification(draft.title, {
        body: draft.body,
        tag: draft.dedupeKey,
        icon: "/favicon.ico",
      });
    } catch {
      /* browser refused: in-app record is still stored */
    }
  },
};

/** Placeholder for a future paid SMS gateway. Intentionally disabled. */
export const SMSProvider: NotificationProvider = {
  id: "sms",
  label: "SMS gateway (not configured)",
  isEnabled: () => false,
  deliver: () => {},
};

/** Placeholder for a future WhatsApp Business provider. Intentionally disabled. */
export const WhatsAppProvider: NotificationProvider = {
  id: "whatsapp",
  label: "WhatsApp (not configured)",
  isEnabled: () => false,
  deliver: () => {},
};

export const providers: NotificationProvider[] = [
  InAppProvider,
  BrowserPushProvider,
  SMSProvider,
  WhatsAppProvider,
];

/** Fan a draft out to every enabled side channel (in-app is persisted separately). */
export function dispatchToProviders(draft: NotificationDraft) {
  for (const p of providers) {
    if (p.id === "in-app") continue;
    if (!p.isEnabled()) continue;
    try {
      void p.deliver(draft);
    } catch {
      /* a failing channel must never break the booking flow */
    }
  }
}

/** Ask once for browser notification permission. Safe to call repeatedly. */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (window.Notification.permission !== "default") return window.Notification.permission;
  try {
    return await window.Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/* ------------------------------------------------------------- templates */

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Every function returns the notification drafts for one domain event.
 * Booking flows stay free of copywriting and channel logic.
 */
export const notificationService = {
  sendBookingCreatedNotification(b: BookingLike, ctx: { workerName: string; total: number }) {
    const drafts: NotificationDraft[] = [
      {
        audience: "worker",
        target: b.workerId,
        type: b.emergency ? "emergency_assigned" : "booking_created",
        title: b.emergency ? "Emergency job assigned" : "New job request",
        body: `${b.subservice} · ${b.customerName} · ${b.distanceKm} km · ${money(ctx.total)}`,
        tag: b.emergency ? "Emergency" : "Job",
        bookingId: b.id,
        dedupeKey: `worker:${b.workerId}:created:${b.id}`,
      },
      {
        audience: "customer",
        target: b.customerEmail,
        type: b.emergency ? "emergency_created" : "booking_requested",
        title: b.emergency ? "Emergency booking created" : "Booking requested",
        body: b.emergency
          ? `${b.id} · ${b.subservice} sent to ${ctx.workerName} on priority. Status: waiting for acceptance.`
          : `Your booking request has been sent to the worker. ${b.id} · ${b.subservice} · ${ctx.workerName}.`,
        tag: b.emergency ? "Emergency" : "Booking",
        bookingId: b.id,
        dedupeKey: `customer:${b.customerEmail}:created:${b.id}`,
      },
    ];
    return drafts;
  },

  sendBookingAcceptedNotification(b: BookingLike, ctx: { workerName: string }): NotificationDraft[] {
    return [
      {
        audience: "customer",
        target: b.customerEmail,
        type: "booking_accepted",
        title: "Booking accepted",
        body: `Your booking has been accepted. ${ctx.workerName} will handle ${b.subservice} (${b.id}).`,
        tag: "Booking",
        bookingId: b.id,
        dedupeKey: `customer:${b.customerEmail}:accepted:${b.id}`,
      },
    ];
  },

  sendBookingRejectedNotification(
    b: BookingLike,
    ctx: { workerName: string; reason: string },
  ): NotificationDraft[] {
    return [
      {
        audience: "customer",
        target: b.customerEmail,
        type: "booking_rejected",
        title: "Booking request rejected",
        body: `${ctx.workerName} could not take ${b.id} · ${b.subservice}. ${ctx.reason} You can book another worker.`,
        tag: "Booking",
        bookingId: b.id,
        dedupeKey: `customer:${b.customerEmail}:rejected:${b.id}`,
      },
    ];
  },

  sendBookingStartedNotification(b: BookingLike, ctx: { workerName: string }): NotificationDraft[] {
    return [
      {
        audience: "customer",
        target: b.customerEmail,
        type: "booking_started",
        title: "Service started",
        body: `Your service has started. ${ctx.workerName} is working on ${b.subservice} (${b.id}).`,
        tag: "Booking",
        bookingId: b.id,
        dedupeKey: `customer:${b.customerEmail}:started:${b.id}`,
      },
    ];
  },

  sendBookingProgressNotification(
    b: BookingLike,
    ctx: { workerName: string; status: string },
  ): NotificationDraft[] {
    return [
      {
        audience: "customer",
        target: b.customerEmail,
        type: "booking_progress",
        title: `Worker update: ${ctx.status}`,
        body: `${ctx.workerName} is now "${ctx.status}" for ${b.subservice} (${b.id}).`,
        tag: "Booking",
        bookingId: b.id,
        dedupeKey: `customer:${b.customerEmail}:progress:${ctx.status}:${b.id}`,
      },
    ];
  },

  sendBookingCompletedNotification(
    b: BookingLike,
    ctx: { workerName: string },
  ): NotificationDraft[] {
    return [
      {
        audience: "customer",
        target: b.customerEmail,
        type: "booking_completed",
        title: "Service completed",
        body: `Your service has been completed. Please rate ${ctx.workerName} and view the invoice for ${b.id}.`,
        tag: "Booking",
        bookingId: b.id,
        dedupeKey: `customer:${b.customerEmail}:completed:${b.id}`,
      },
      {
        audience: "worker",
        target: b.workerId,
        type: "booking_completed",
        title: "Job completed",
        body: `${b.subservice} (${b.id}) for ${b.customerName} is marked complete.`,
        tag: "Job",
        bookingId: b.id,
        dedupeKey: `worker:${b.workerId}:completed:${b.id}`,
      },
    ];
  },

  sendBookingCancelledNotification(
    b: BookingLike,
    ctx: { by: "customer" | "worker"; reason: string },
  ): NotificationDraft[] {
    const other: NotificationAudience = ctx.by === "customer" ? "worker" : "customer";
    return [
      {
        audience: other,
        target: other === "worker" ? b.workerId : b.customerEmail,
        type: "booking_cancelled",
        title: "Booking cancelled",
        body: `${b.id} · ${b.subservice} was cancelled by the ${ctx.by}. ${ctx.reason}`,
        tag: "Booking",
        bookingId: b.id,
        dedupeKey: `${other}:${other === "worker" ? b.workerId : b.customerEmail}:cancelled:${b.id}`,
      },
    ];
  },

  sendPaymentNotification(
    b: BookingLike,
    ctx: { status: string; total: number; method?: string },
  ): NotificationDraft[] {
    const paid = ctx.status === "Paid";
    const detail = ctx.method ? ` via ${ctx.method}` : "";
    return [
      {
        audience: "customer",
        target: b.customerEmail,
        type: "payment_status",
        title: paid ? "Payment successful" : `Payment ${ctx.status.toLowerCase()}`,
        body: paid
          ? `${money(ctx.total)} paid${detail} for ${b.id} · ${b.subservice}.`
          : `Payment for ${b.id} · ${b.subservice} is now ${ctx.status}.`,
        tag: "Payment",
        bookingId: b.id,
        dedupeKey: `customer:${b.customerEmail}:payment:${ctx.status}:${b.id}`,
      },
      {
        audience: "worker",
        target: b.workerId,
        type: "payment_status",
        title: paid ? "Payment received" : `Payment ${ctx.status.toLowerCase()}`,
        body: paid
          ? `${money(ctx.total)} recorded for ${b.id} · ${b.subservice}.`
          : `Payment status for ${b.id} changed to ${ctx.status}.`,
        tag: "Payment",
        bookingId: b.id,
        dedupeKey: `worker:${b.workerId}:payment:${ctx.status}:${b.id}`,
      },
    ];
  },

  sendUpcomingBookingNotification(
    b: BookingLike,
    ctx: { minutes: number; workerName: string },
  ): NotificationDraft[] {
    const when = `${ctx.minutes} min`;
    return [
      {
        audience: "worker",
        target: b.workerId,
        type: "booking_upcoming",
        title: "Upcoming job",
        body: `${b.subservice} for ${b.customerName} starts in about ${when} (${b.slot}).`,
        tag: "Job",
        bookingId: b.id,
        dedupeKey: `worker:${b.workerId}:upcoming:${b.id}`,
      },
      {
        audience: "customer",
        target: b.customerEmail,
        type: "booking_upcoming",
        title: "Service starting soon",
        body: `${ctx.workerName} is scheduled for ${b.subservice} in about ${when} (${b.slot}).`,
        tag: "Booking",
        bookingId: b.id,
        dedupeKey: `customer:${b.customerEmail}:upcoming:${b.id}`,
      },
    ];
  },

  sendMessageNotification(
    b: BookingLike,
    ctx: { from: "customer" | "worker"; text: string; at: number },
  ): NotificationDraft[] {
    const to: NotificationAudience = ctx.from === "customer" ? "worker" : "customer";
    return [
      {
        audience: to,
        target: to === "worker" ? b.workerId : b.customerEmail,
        type: "message",
        title: "New message",
        body: ctx.text.slice(0, 90),
        tag: "Message",
        bookingId: b.id,
        dedupeKey: `${to}:message:${b.id}:${ctx.at}`,
      },
    ];
  },

  sendRatingNotification(
    b: BookingLike,
    ctx: { stars: number; comment: string },
  ): NotificationDraft[] {
    return [
      {
        audience: "worker",
        target: b.workerId,
        type: "rating",
        title: `New ${ctx.stars}-star rating`,
        body: ctx.comment ? ctx.comment.slice(0, 90) : `Rated for ${b.subservice} (${b.id}).`,
        tag: "Rating",
        bookingId: b.id,
        dedupeKey: `worker:${b.workerId}:rating:${b.id}`,
      },
    ];
  },
};
