import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Languages, MapPin, ShieldCheck, Star } from "lucide-react";
import { AppHeader, Pill } from "@/components/saha/shell";
import { categories, inr, workers } from "@/lib/sahaseva-data";

export const Route = createFileRoute("/app/workers/$workerId")({
  head: () => ({
    meta: [
      { title: "Worker profile · SahaSeva" },
      {
        name: "description",
        content:
          "See a cooperative worker's verified skills, rating, completed jobs, society membership, service area and charges before booking.",
      },
      { property: "og:title", content: "Worker profile · SahaSeva" },
      { property: "og:description", content: "Transparent trust information for every worker." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ params }) => {
    const worker = workers.find((w) => w.id === params.workerId);
    if (!worker) throw notFound();
    return { workerId: worker.id };
  },
  component: WorkerProfile,
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">Worker not found.</div>
  ),
  errorComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Could not load this profile.
    </div>
  ),
});

const reviews = [
  { by: "Lakshmi D.", stars: 5, text: "Came on time, explained the problem clearly, fair charge." },
  { by: "Sunrise Clinic", stars: 4, text: "Handled our emergency maintenance late in the evening." },
  { by: "Ramesh K.", stars: 5, text: "Polite and neat work. Cooperative billing was transparent." },
];

function WorkerProfile() {
  const { workerId } = Route.useLoaderData();
  const navigate = useNavigate();
  const w = workers.find((x) => x.id === workerId)!;
  const cat = categories.find((c) => c.id === w.categoryId)!;

  return (
    <>
      <AppHeader
        title={w.name}
        subtitle={`${cat.name} · ${w.id}`}
        right={
          <button
            onClick={() => navigate({ to: "/app/services" })}
            className="grid h-9 w-9 place-items-center rounded-full border bg-background"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        }
      />

      <div className="space-y-4 p-4">
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span
              className="grid h-16 w-16 place-items-center rounded-2xl text-lg font-bold text-primary-foreground"
              style={{ backgroundColor: w.photoTint }}
            >
              {w.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-base font-extrabold">
                {w.name} <BadgeCheck className="h-4 w-4 text-success" />
              </p>
              <p className="text-xs text-muted-foreground">{w.society}</p>
              <p className="mt-1 flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {w.rating}
                </span>
                <span className="text-muted-foreground">{w.jobs} jobs</span>
                <span className="text-muted-foreground">{w.experience} yrs</span>
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ["Identity Verified", w.verified.identity],
              ["Skill Verified", w.verified.skill],
              ["Certificate Verified", w.verified.certificate],
              ["Cooperative Member", w.verified.member],
            ].map(([label, ok]) => (
              <div
                key={label as string}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-semibold ${
                  ok ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> {label as string}
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <Metric label="Completion" value={`${w.completionRate}%`} />
          <Metric label="Distance" value={`${w.distanceKm} km`} />
          <Metric label="Visit charge" value={inr(w.hourly)} />
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="text-sm font-bold">Skills & services</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {w.skills.map((s) => (
              <Pill key={s} tone="primary">
                {s}
              </Pill>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {w.area} · service radius {w.radiusKm} km
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Languages className="h-3.5 w-3.5" /> {w.languages.join(", ")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Availability: {w.availableNow ? "Available now" : "Next slot tomorrow morning"}
          </p>
          <p className="mt-3 rounded-xl bg-muted p-3 text-[11px] text-muted-foreground">
            KYC documents, bank details and verification files are never shown to customers.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="text-sm font-bold">Reviews</h2>
          <ul className="mt-2 space-y-3">
            {reviews.map((r) => (
              <li key={r.by} className="border-b pb-3 last:border-0 last:pb-0">
                <p className="flex items-center gap-2 text-xs font-bold">
                  {r.by}
                  <span className="flex items-center gap-0.5 text-accent">
                    {Array.from({ length: r.stars }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-accent" />
                    ))}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{r.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <Link
          to="/app/book"
          search={{ category: w.categoryId, sub: undefined }}
          className="block w-full rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-primary-foreground shadow-card"
        >
          Book {w.name.split(" ")[0]}
        </Link>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-3 text-center shadow-card">
      <p className="text-sm font-extrabold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
