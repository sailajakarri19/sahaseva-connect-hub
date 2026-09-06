import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  FileWarning,
  Globe,
  LogOut,
  MapPin,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader, Pill } from "@/components/saha/shell";
import { useSession, useSignOut } from "@/lib/session";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "My profile · SahaSeva" },
      {
        name: "description",
        content:
          "Manage saved addresses, language, payment methods, notifications, complaints and account security on SahaSeva.",
      },
      { property: "og:title", content: "My profile · SahaSeva" },
      { property: "og:description", content: "Addresses, payments, language and complaints." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

const addresses = [
  { label: "Home", text: "H.No 4-21, Kondapur Village, Sangareddy Mandal – 502285" },
  { label: "Parents", text: "Ward 3, Jogipet Town, Sangareddy District – 502270" },
];

const complaintTypes = [
  "No-show",
  "Poor service",
  "Wrong service",
  "Unexpected charge",
  "Behaviour",
  "Payment issue",
  "Other",
];

function Profile() {
  const { session } = useSession();
  const signOut = useSignOut();

  return (
    <>
      <AppHeader title="Profile" subtitle={session?.email} />
      <div className="space-y-4 p-4">
        <section className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-lg font-bold text-primary-foreground">
            {session?.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-base font-extrabold">{session?.name}</p>
            <p className="text-xs text-muted-foreground">{session?.org}</p>
            <Pill tone="success">Mobile verified</Pill>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
            <MapPin className="h-4 w-4 text-primary" /> Saved addresses
          </h2>
          {addresses.map((a) => (
            <div key={a.label} className="border-b py-2 last:border-0">
              <p className="text-xs font-bold">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.text}</p>
            </div>
          ))}
          <button
            onClick={() => toast.success("Add address form opened")}
            className="mt-2 text-xs font-bold text-primary"
          >
            + Add new address
          </button>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
            <Wallet className="h-4 w-4 text-primary" /> Payments
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Pill tone="primary">UPI</Pill>
            <Pill tone="primary">Debit / Credit card</Pill>
            <Pill tone="primary">Netbanking</Pill>
            <Pill>Cash (if society allows)</Pill>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Sandbox payments in this prototype. Statuses: pending, paid, failed, refunded,
            disputed — each with a transaction ID.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
            <FileWarning className="h-4 w-4 text-primary" /> Raise a complaint
          </h2>
          <div className="flex flex-wrap gap-2">
            {complaintTypes.map((t) => (
              <button
                key={t}
                onClick={() => toast.success(`Complaint drafted: ${t}`)}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Submitted → Under review → Evidence → Society/Admin review → Decision → Resolved.
          </p>
        </section>

        <section className="divide-y rounded-2xl border bg-card shadow-card">
          <Item icon={Globe} label="Preferred language" value="Telugu" />
          <Item icon={Bell} label="Notification preferences" value="All on" />
          <Item icon={ShieldCheck} label="Security & sessions" value="Session expires in 24 h" />
          <Item icon={Star} label="My reviews" value="12 written" />
        </section>

        <Link to="/notifications" className="block text-center text-xs font-bold text-primary">
          Open notification centre
        </Link>

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

function Item({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bell;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3.5">
      <Icon className="h-4 w-4 text-primary" />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}
