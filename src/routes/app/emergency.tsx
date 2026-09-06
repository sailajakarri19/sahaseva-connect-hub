import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, MapPin, Siren, Timer } from "lucide-react";
import { toast } from "sonner";
import { AppHeader, Pill } from "@/components/saha/shell";
import { categories, inr, workers } from "@/lib/sahaseva-data";

export const Route = createFileRoute("/app/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency service · SahaSeva" },
      {
        name: "description",
        content:
          "Raise an urgent request and get verified cooperative workers who are available now, ranked by distance and ETA.",
      },
      { property: "og:title", content: "Emergency service · SahaSeva" },
      { property: "og:description", content: "Verified help, fast, near you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Emergency,
});

function Emergency() {
  const navigate = useNavigate();
  const [catId, setCatId] = useState("electrical");
  const [problem, setProblem] = useState("");
  const [requested, setRequested] = useState<string | null>(null);

  const available = workers
    .filter((w) => w.categoryId === catId && w.availableNow && w.status === "Verified")
    .sort((a, b) => a.etaMin - b.etaMin);

  return (
    <>
      <AppHeader
        title="Emergency service"
        subtitle="Available verified workers only"
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
        <div className="flex items-center gap-3 rounded-2xl bg-warm p-4 text-accent-foreground shadow-card">
          <Siren className="h-6 w-6" />
          <p className="text-sm font-semibold">
            Emergency requests are prioritised by availability, skill, distance and verification.
          </p>
        </div>

        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-3 text-sm font-bold">Select service</h2>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => setCatId(c.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  catId === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary p-3 text-xs font-semibold text-secondary-foreground">
            <MapPin className="h-4 w-4" /> Using current location · Kondapur Village, Sangareddy
          </div>

          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={2}
            placeholder="Describe the emergency briefly"
            className="mt-3 w-full rounded-xl border bg-background p-3 text-sm outline-none"
          />
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-3 text-sm font-bold">Available now near you</h2>
          <div className="space-y-2">
            {available.map((w) => (
              <div key={w.id} className="rounded-xl border p-3">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-primary-foreground"
                    style={{ backgroundColor: w.photoTint }}
                  >
                    {w.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-sm font-bold">
                      {w.name} <BadgeCheck className="h-3.5 w-3.5 text-success" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {w.distanceKm} km away · ETA {w.etaMin} min · est. {inr(w.hourly + 100)}
                    </p>
                  </div>
                  <Pill tone="success">
                    <Timer className="h-3 w-3" /> Now
                  </Pill>
                </div>
                <button
                  onClick={() => {
                    setRequested(w.name);
                    toast.success(`Emergency request sent to ${w.name}`);
                  }}
                  className="mt-3 w-full rounded-lg bg-destructive py-2.5 text-xs font-bold text-destructive-foreground"
                >
                  Confirm emergency request
                </button>
              </div>
            ))}
            {available.length === 0 && (
              <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                No worker is free right now in this category. We are widening the search to nearby
                mandals — you will get a notification within minutes.
              </p>
            )}
          </div>
        </section>

        {requested && (
          <div className="rounded-2xl border border-success/40 bg-success/10 p-4 text-sm font-semibold text-success">
            {requested} has been alerted. Track live status in Bookings.
          </div>
        )}
      </div>
    </>
  );
}
