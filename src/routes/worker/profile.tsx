import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { AppHeader, Pill } from "@/components/saha/shell";
import { useSession, useSignOut } from "@/lib/session";
import { workers } from "@/lib/sahaseva-data";

export const Route = createFileRoute("/worker/profile")({
  head: () => ({
    meta: [
      { title: "Worker profile & settings · SahaSeva" },
      {
        name: "description",
        content:
          "Manage skills, services, service areas, languages, availability, certificates, payout details and security as a cooperative worker.",
      },
      { property: "og:title", content: "Worker profile & settings · SahaSeva" },
      { property: "og:description", content: "Profile, verification and payout settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkerProfileSettings,
});

function WorkerProfileSettings() {
  const { session } = useSession();
  const signOut = useSignOut();
  const w = workers[0]!;

  return (
    <>
      <AppHeader title="Profile & settings" subtitle={session?.email} />
      <div className="space-y-3 p-4">
        <section className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
          <span
            className="grid h-14 w-14 place-items-center rounded-2xl text-lg font-bold text-primary-foreground"
            style={{ backgroundColor: w.photoTint }}
          >
            RK
          </span>
          <div>
            <p className="text-base font-extrabold">{session?.name}</p>
            <p className="text-xs text-muted-foreground">
              {w.id} · {w.membershipId}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              <Pill tone="success">Verified</Pill>
              <Pill tone="primary">Cooperative member</Pill>
            </div>
          </div>
        </section>

        <Group title="Public profile">
          <Line k="Skills" v={w.skills.join(", ")} />
          <Line k="Services" v="Electrical · 7 subservices" />
          <Line k="Service areas" v={`${w.area} · ${w.radiusKm} km`} />
          <Line k="Languages" v={w.languages.join(", ")} />
        </Group>

        <Group title="Availability">
          <Line k="Status" v="Available" />
          <Line k="Working hours" v="8:00 AM – 8:00 PM" />
          <Line k="Working days" v="Mon – Sat" />
        </Group>

        <Group title="Verification">
          <Line k="Identity (KYC)" v="Verified" />
          <Line k="Cooperative membership" v="Verified" />
          <Line k="Skill certificate" v="Verified · expires Mar 2027" />
          <Line k="New certificate upload" v="Pending Verification" warn />
        </Group>

        <Group title="Payout & security">
          <Line k="Payout account" v="Cooperative payout · ••••4213" />
          <Line k="Notifications" v="All on" />
          <Line k="Session" v="Expires in 24 hours" />
        </Group>

        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 py-3 text-sm font-bold text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card">
      <h2 className="mb-2 text-sm font-bold">{title}</h2>
      <div className="divide-y">{children}</div>
    </section>
  );
}

function Line({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className={`text-right font-semibold ${warn ? "text-warning-foreground" : ""}`}>{v}</span>
    </div>
  );
}
