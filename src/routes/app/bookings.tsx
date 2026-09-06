import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarClock,
  FileText,
  MapPin,
  MessageSquare,
  Phone as PhoneIcon,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader, NotificationsButton, Pill } from "@/components/saha/shell";
import { bookings, categories, inr, workers, type Booking } from "@/lib/sahaseva-data";

export const Route = createFileRoute("/app/bookings")({
  head: () => ({
    meta: [
      { title: "My bookings · SahaSeva" },
      {
        name: "description",
        content:
          "Track upcoming, active and completed SahaSeva bookings with live status, invoices, ratings and rebooking.",
      },
      { property: "og:title", content: "My bookings · SahaSeva" },
      { property: "og:description", content: "Live booking status and digital invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Bookings,
});

const lifecycle = ["Requested", "Accepted", "On The Way", "Arrived", "In Service", "Completed"];

function Bookings() {
  const [tab, setTab] = useState<"Upcoming" | "Active" | "Completed">("Active");
  const [invoice, setInvoice] = useState<Booking | null>(null);

  const list = bookings.filter((b) =>
    tab === "Completed"
      ? b.status === "Completed"
      : tab === "Active"
        ? ["On The Way", "Arrived", "In Service"].includes(b.status)
        : ["Requested", "Accepted"].includes(b.status),
  );

  return (
    <>
      <AppHeader title="My bookings" subtitle="Cooperative service history" right={<NotificationsButton />} />

      <div className="sticky top-[57px] z-10 grid grid-cols-3 gap-1 border-b bg-card px-4 py-2 text-xs font-bold">
        {(["Upcoming", "Active", "Completed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full py-2 ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3 p-4">
        {list.map((b) => {
          const w = workers.find((x) => x.id === b.workerId)!;
          const step = lifecycle.indexOf(b.status);
          const total = b.amount + b.materials + b.coopFee + b.platformFee;
          return (
            <article key={b.id} className="rounded-2xl border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{b.subservice}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {categories.find((c) => c.id === b.categoryId)?.name} · {w.name} · {b.id}
                  </p>
                </div>
                <Pill tone={b.status === "Completed" ? "success" : b.emergency ? "danger" : "primary"}>
                  {b.emergency ? "Emergency" : b.status}
                </Pill>
              </div>

              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" /> {b.date} · {b.slot}
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {b.address}
              </p>

              {tab === "Active" && (
                <div className="mt-3 rounded-xl bg-secondary p-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-secondary-foreground">
                    <span>{w.distanceKm} km away</span>
                    <span>ETA {w.etaMin} min</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${((step + 1) / lifecycle.length) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-secondary-foreground/80">
                    {lifecycle.map((s, i) => (
                      <span key={s} className={i <= step ? "font-bold text-primary" : ""}>
                        {s}
                        {i < lifecycle.length - 1 && " ›"}
                      </span>
                    ))}
                  </div>
                  <div className="relative mt-3 h-24 overflow-hidden rounded-lg border bg-card">
                    <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(0deg,transparent_0_20px,var(--border)_20px_21px),repeating-linear-gradient(90deg,transparent_0_20px,var(--border)_20px_21px)]" />
                    <span className="absolute left-6 top-10 h-3 w-3 rounded-full bg-accent ring-4 ring-accent/25" />
                    <span className="absolute right-8 top-6 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/25" />
                    <span className="absolute bottom-2 left-2 rounded bg-card px-1.5 py-0.5 text-[10px] font-semibold">
                      Live tracking · visible only during this booking
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {b.status !== "Completed" ? (
                  <>
                    <Action onClick={() => toast.success("Reschedule request sent")}>
                      <CalendarClock className="h-3.5 w-3.5" /> Reschedule
                    </Action>
                    <Action onClick={() => toast("Chat opened with " + w.name)}>
                      <MessageSquare className="h-3.5 w-3.5" /> Chat
                    </Action>
                    <Action onClick={() => toast("Connecting via masked number")}>
                      <PhoneIcon className="h-3.5 w-3.5" /> Call
                    </Action>
                    <Action
                      danger
                      onClick={() => toast.error("Cancellation policy applies before confirming")}
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Action>
                  </>
                ) : (
                  <>
                    <Action onClick={() => setInvoice(b)}>
                      <FileText className="h-3.5 w-3.5" /> Invoice · {inr(total)}
                    </Action>
                    <Action onClick={() => toast.success("Thanks for rating!")}>
                      <Star className="h-3.5 w-3.5" /> Rate · {b.rating ?? "—"}
                    </Action>
                    <Action onClick={() => toast.success("Added to booking flow")}>Book again</Action>
                  </>
                )}
              </div>
            </article>
          );
        })}
        {list.length === 0 && (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </p>
        )}
      </div>

      {invoice && (
        <div className="fixed inset-0 z-40 grid place-items-end bg-foreground/40 p-0 md:place-items-center">
          <div className="max-h-[85vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-card p-5 md:rounded-3xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-extrabold">SahaSeva</p>
                <p className="text-[11px] text-muted-foreground">Digital invoice</p>
              </div>
              <button onClick={() => setInvoice(null)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-1 text-xs">
              <InvRow k="Booking ID" v={invoice.id} />
              <InvRow k="Customer" v={invoice.customer} />
              <InvRow k="Worker" v={workers.find((w) => w.id === invoice.workerId)!.name} />
              <InvRow k="Cooperative" v={workers.find((w) => w.id === invoice.workerId)!.society} />
              <InvRow k="Service" v={invoice.subservice} />
              <InvRow k="Date / time" v={`${invoice.date} · ${invoice.slot}`} />
            </div>
            <div className="mt-4 space-y-1 border-t pt-3 text-sm">
              <InvRow k="Service charge" v={inr(invoice.amount)} />
              <InvRow k="Materials" v={inr(invoice.materials)} />
              <InvRow k="Cooperative contribution" v={inr(invoice.coopFee)} />
              <InvRow k="Platform fee" v={inr(invoice.platformFee)} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-base font-extrabold">
              <span>Total</span>
              <span>
                {inr(invoice.amount + invoice.materials + invoice.coopFee + invoice.platformFee)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <Pill tone="success">{invoice.payment}</Pill>
              <span className="text-muted-foreground">{invoice.txn ?? "—"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Action({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        danger ? "border-destructive/40 text-destructive" : "text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function InvRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}
