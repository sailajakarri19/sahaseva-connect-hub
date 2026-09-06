import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, Check, MapPin, Siren, X } from "lucide-react";
import { toast } from "sonner";
import {
  AppHeader,
  NotificationsButton,
  Pill,
  Section,
  SignOutButton,
  Stat,
} from "@/components/saha/shell";
import { inr } from "@/lib/sahaseva-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/worker/")({
  head: () => ({
    meta: [
      { title: "Worker home · SahaSeva" },
      {
        name: "description",
        content:
          "Cooperative worker home: availability toggle, new job requests, today's jobs, earnings and AI smart job matches.",
      },
      { property: "og:title", content: "Worker home · SahaSeva" },
      { property: "og:description", content: "Your jobs, earnings and availability in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkerHome,
});

const requests = [
  { id: "SS-B-90501", service: "Fan repair", customer: "Lakshmi D.", km: 1.8, when: "Today · 4–6 PM", price: 300, emergency: false },
  { id: "SS-B-90502", service: "Wiring check", customer: "Sunrise Clinic", km: 3.2, when: "Today · 6–8 PM", price: 850, emergency: true },
  { id: "SS-B-90503", service: "Light installation", customer: "Zilla School", km: 5.6, when: "Tomorrow · 10–12", price: 450, emergency: false },
];

const smartMatches = [
  { job: "Inverter service · Sangareddy Town", why: "Matches your certified skill · 2.1 km · high demand area", earn: 520 },
  { job: "Fan installation × 3 · Kondapur", why: "Bundle of 3 jobs in one street · fits your 4–6 PM gap", earn: 900 },
  { job: "Basic maintenance · Jogipet", why: "Low workload day tomorrow · within your 12 km radius", earn: 400 },
];

function WorkerHome() {
  const { session } = useSession();
  const [online, setOnline] = useState(true);

  return (
    <>
      <AppHeader
        title={`Namaste, ${session?.name.split(" ")[0] ?? "Worker"}`}
        subtitle={session?.org}
        right={
          <>
            <NotificationsButton />
            <SignOutButton />
          </>
        }
      />

      <div className="bg-brand px-4 py-4 text-primary-foreground">
        <div className="flex items-center justify-between rounded-2xl bg-primary-foreground/10 p-3">
          <div>
            <p className="text-sm font-bold">{online ? "You are available" : "You are offline"}</p>
            <p className="flex items-center gap-1 text-xs opacity-80">
              <MapPin className="h-3 w-3" /> Sangareddy Mandal · 12 km radius
            </p>
          </div>
          <button
            onClick={() => setOnline((v) => !v)}
            className={`h-7 w-12 rounded-full p-1 transition-colors ${online ? "bg-success" : "bg-muted-foreground/50"}`}
            aria-label="Toggle availability"
          >
            <span
              className={`block h-5 w-5 rounded-full bg-card transition-transform ${online ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4">
        <Stat label="Today's jobs" value="3" />
        <Stat label="Completed" value="412" />
        <Stat label="Earnings" value={inr(1450)} tone="success" />
      </div>

      <Section title="New requests" action={<Pill tone="warning">{requests.length} pending</Pill>}>
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-3.5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{r.service}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.customer} · {r.km} km · {r.when}
                  </p>
                </div>
                {r.emergency ? (
                  <Pill tone="danger">
                    <Siren className="h-3 w-3" /> Emergency
                  </Pill>
                ) : (
                  <span className="text-sm font-extrabold">{inr(r.price)}</span>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => toast.success(`Accepted ${r.service}`)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground"
                >
                  <Check className="h-3.5 w-3.5" /> Accept
                </button>
                <button
                  onClick={() => toast("Declined")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Smart job match">
        <div className="space-y-2">
          {smartMatches.map((m) => (
            <div key={m.job} className="rounded-2xl border border-primary/25 bg-secondary p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <BrainCircuit className="h-3.5 w-3.5" /> Recommended
              </p>
              <p className="mt-1 text-sm font-bold text-secondary-foreground">{m.job}</p>
              <p className="text-xs text-secondary-foreground/80">{m.why}</p>
              <p className="mt-1 text-xs font-bold">Estimated earning {inr(m.earn)}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          The system only recommends — you always choose which jobs to take.
        </p>
      </Section>
    </>
  );
}
