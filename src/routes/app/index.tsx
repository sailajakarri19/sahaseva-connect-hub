import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Car,
  Droplets,
  HardHat,
  Hammer,
  HeartHandshake,
  Home,
  MapPin,
  Paintbrush,
  Search,
  Siren,
  Sparkles,
  Sprout,
  Star,
  Wrench,
  Zap,
  Sparkle,
} from "lucide-react";
import {
  AppHeader,
  NotificationsButton,
  Pill,
  Section,
  SignOutButton,
} from "@/components/saha/shell";
import {
  assistantSuggest,
  bookings,
  categories,
  inr,
  workers,
} from "@/lib/sahaseva-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Home · SahaSeva Customer" },
      {
        name: "description",
        content:
          "Search services, book verified cooperative workers and raise emergency requests from your SahaSeva home screen.",
      },
      { property: "og:title", content: "SahaSeva Customer Home" },
      {
        property: "og:description",
        content: "Book verified cooperative workers near your village, town or city.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerHome,
});

const iconMap: Record<string, typeof Zap> = {
  Zap,
  Droplets,
  Sparkles,
  Hammer,
  Paintbrush,
  Sprout,
  Wrench,
  HeartHandshake,
  Car,
  Home,
  HardHat,
};

function CustomerHome() {
  const { session } = useSession();
  const [q, setQ] = useState("");
  const suggestion = q.trim().length > 3 ? assistantSuggest(q) : null;
  const active = bookings.find((b) => b.status === "On The Way");
  const activeWorker = workers.find((w) => w.id === active?.workerId);

  return (
    <>
      <AppHeader
        title={`Namaste, ${session?.name.split(" ")[0] ?? "there"}`}
        subtitle="Kondapur Village, Sangareddy · Telangana"
        right={
          <>
            <NotificationsButton />
            <SignOutButton />
          </>
        }
      />

      <div className="bg-brand px-4 pb-8 pt-4 text-primary-foreground">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/80">
          <MapPin className="h-3.5 w-3.5" /> Delivering to Kondapur Village · change
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-card px-3 py-3 text-foreground shadow-float">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What service do you need?"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {q.trim().length > 3 && (
          <div className="mt-3 rounded-2xl bg-card p-3 text-foreground shadow-float">
            <p className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <Sparkle className="h-3.5 w-3.5" /> SahaSeva Assistant
            </p>
            {suggestion ? (
              <>
                <p className="mt-1.5 text-sm">
                  {suggestion.note} We suggest{" "}
                  <span className="font-bold">{suggestion.category.name}</span> →{" "}
                  <span className="font-bold">{suggestion.sub.name}</span>.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Estimated {inr(suggestion.sub.range[0])} – {inr(suggestion.sub.range[1])}
                </p>
                <Link
                  to="/app/book"
                  search={{ category: suggestion.category.id, sub: suggestion.sub.name }}
                  className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                >
                  Continue booking
                </Link>
              </>
            ) : (
              <p className="mt-1.5 text-sm text-muted-foreground">
                Describe the problem in your own words — for example “my kitchen tap is leaking”
                or “fan is making noise”.
              </p>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground">
              The assistant only helps you pick a service. It never gives medical or electrical
              safety advice.
            </p>
          </div>
        )}
      </div>

      <div className="-mt-5 px-4">
        <Link
          to="/app/emergency"
          className="flex items-center gap-3 rounded-2xl bg-warm p-4 text-accent-foreground shadow-float"
        >
          <div className="grid h-11 w-11 place-items-center rounded-full bg-card/40">
            <Siren className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">Need a service urgently?</p>
            <p className="text-xs opacity-85">
              Verified workers available now, matched by distance and ETA.
            </p>
          </div>
          <span className="rounded-full bg-card px-3 py-1.5 text-xs font-bold text-foreground">
            Book
          </span>
        </Link>
      </div>

      {active && activeWorker && (
        <Section title="Active booking" action={<Pill tone="success">{active.status}</Pill>}>
          <Link
            to="/app/bookings"
            className="block rounded-2xl border bg-card p-4 shadow-card"
          >
            <p className="text-sm font-bold">
              {active.subservice} · {activeWorker.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeWorker.distanceKm} km away · ETA {activeWorker.etaMin} min · {active.slot}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/4 rounded-full bg-primary" />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Requested → Accepted → <b className="text-foreground">On the way</b> → Arrived → In
              service → Completed
            </p>
          </Link>
        </Section>
      )}

      <Section
        title="Popular services"
        action={
          <Link to="/app/services" className="text-xs font-bold text-primary">
            View all
          </Link>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          {categories.slice(0, 8).map((c) => {
            const Icon = iconMap[c.icon] ?? Wrench;
            return (
              <Link
                key={c.id}
                to="/app/book"
                search={{ category: c.id, sub: undefined }}
                className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card p-2.5 text-center shadow-card"
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl"
                  style={{ backgroundColor: `color-mix(in oklch, ${c.color} 18%, transparent)` }}
                >
                  <Icon className="h-5 w-5" style={{ color: c.color }} />
                </span>
                <span className="text-[10px] font-semibold leading-tight">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section title="Top rated near you">
        <div className="space-y-2">
          {workers
            .filter((w) => w.status === "Verified")
            .slice(0, 3)
            .map((w) => (
              <Link
                key={w.id}
                to="/app/workers/$workerId"
                params={{ workerId: w.id }}
                className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card"
              >
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-primary-foreground"
                  style={{ backgroundColor: w.photoTint }}
                >
                  {w.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold">{w.name}</span>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-success" />
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {categories.find((c) => c.id === w.categoryId)?.name} · {w.experience} yrs ·{" "}
                    {w.distanceKm} km
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-xs font-semibold">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                    {w.rating} · {w.jobs} jobs
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold">{inr(w.hourly)}</span>
                  <span className="text-[10px] text-muted-foreground">visit charge</span>
                </span>
              </Link>
            ))}
        </div>
      </Section>

      <div className="px-4 pb-6 pt-2">
        <div className="rounded-2xl border border-primary/25 bg-secondary p-4">
          <p className="text-sm font-bold text-secondary-foreground">
            Every worker is a cooperative member
          </p>
          <p className="mt-1 text-xs text-secondary-foreground/80">
            Fair wages, insurance and welfare are funded through the cooperative fee shown
            transparently on every invoice.
          </p>
        </div>
      </div>
    </>
  );
}
