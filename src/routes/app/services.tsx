import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, List, Map as MapIcon, Search, SlidersHorizontal, Star } from "lucide-react";
import { AppHeader, NotificationsButton, Pill } from "@/components/saha/shell";
import { categories, inr, workers } from "@/lib/sahaseva-data";

export const Route = createFileRoute("/app/services")({
  head: () => ({
    meta: [
      { title: "Find services · SahaSeva" },
      {
        name: "description",
        content:
          "Search cooperative workers by service, distance, rating, price, experience and availability in list or map view.",
      },
      { property: "og:title", content: "Find services · SahaSeva" },
      {
        property: "og:description",
        content: "Smart service search across villages, mandals and towns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Services,
});

type Sort = "nearest" | "rating" | "price" | "available" | "experience";

function Services() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("nearest");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");

  const results = useMemo(() => {
    let list = workers.filter((w) => w.status === "Verified");
    if (cat) list = list.filter((w) => w.categoryId === cat);
    if (onlyAvailable) list = list.filter((w) => w.availableNow);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(t) ||
          w.skills.join(" ").toLowerCase().includes(t) ||
          w.area.toLowerCase().includes(t),
      );
    }
    const sorters: Record<Sort, (a: typeof list[number], b: typeof list[number]) => number> = {
      nearest: (a, b) => a.distanceKm - b.distanceKm,
      rating: (a, b) => b.rating - a.rating,
      price: (a, b) => a.hourly - b.hourly,
      available: (a, b) => Number(b.availableNow) - Number(a.availableNow),
      experience: (a, b) => b.experience - a.experience,
    };
    return [...list].sort(sorters[sort]);
  }, [q, cat, sort, onlyAvailable]);

  return (
    <>
      <AppHeader
        title="Find a service"
        subtitle={`${results.length} verified workers near Kondapur`}
        right={<NotificationsButton />}
      />

      <div className="space-y-3 border-b bg-card px-4 py-3">
        <label className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Service, skill or area"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <FilterChip active={!cat} onClick={() => setCat(null)}>
            All
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              {c.name}
            </FilterChip>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1">
            {(
              [
                ["nearest", "Nearest"],
                ["rating", "Highest rated"],
                ["price", "Lowest price"],
                ["available", "Available now"],
                ["experience", "Most experienced"],
              ] as [Sort, string][]
            ).map(([k, label]) => (
              <FilterChip key={k} active={sort === k} onClick={() => setSort(k)}>
                {label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Available now only
          </label>
          <div className="flex rounded-full border p-0.5">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <MapIcon className="h-3.5 w-3.5" /> Map
            </button>
          </div>
        </div>
      </div>

      {view === "map" ? (
        <div className="p-4">
          <div className="relative h-64 overflow-hidden rounded-2xl border bg-secondary shadow-card">
            <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(0deg,transparent_0_28px,var(--border)_28px_29px),repeating-linear-gradient(90deg,transparent_0_28px,var(--border)_28px_29px)]" />
            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-primary/25" />
            {results.slice(0, 6).map((w, i) => (
              <span
                key={w.id}
                className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full px-2 py-1 text-[10px] font-bold text-primary-foreground shadow-float"
                style={{
                  backgroundColor: w.photoTint,
                  left: `${18 + ((i * 27) % 70)}%`,
                  top: `${22 + ((i * 33) % 60)}%`,
                }}
              >
                {w.distanceKm} km
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Approximate worker positions. Exact customer addresses are never shown publicly — they
            are shared only with the assigned worker during an active booking.
          </p>
        </div>
      ) : (
        <ul className="space-y-2 p-4">
          {results.map((w) => (
            <li key={w.id}>
              <Link
                to="/app/workers/$workerId"
                params={{ workerId: w.id }}
                className="block rounded-2xl border bg-card p-3 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-primary-foreground"
                    style={{ backgroundColor: w.photoTint }}
                  >
                    {w.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-bold">
                      <span className="truncate">{w.name}</span>
                      <BadgeCheck className="h-4 w-4 shrink-0 text-success" />
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {categories.find((c) => c.id === w.categoryId)?.name} · {w.experience} yrs ·{" "}
                      {w.jobs} jobs
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                      <span className="flex items-center gap-1 font-semibold">
                        <Star className="h-3 w-3 fill-accent text-accent" /> {w.rating}
                      </span>
                      <span className="text-muted-foreground">{w.distanceKm} km</span>
                      {w.availableNow ? (
                        <Pill tone="success">Available now</Pill>
                      ) : (
                        <Pill>Busy today</Pill>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">{inr(w.hourly)}</p>
                    <p className="text-[10px] text-muted-foreground">est. visit</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {results.length === 0 && (
            <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No worker in this locality yet. SahaSeva automatically widens the search: village →
              nearby locality → mandal/town → nearby service area.
            </li>
          )}
        </ul>
      )}
    </>
  );
}

function FilterChip({
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
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
