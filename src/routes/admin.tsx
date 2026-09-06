import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BrainCircuit, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, Panel, Table } from "@/components/saha/admin";
import { Pill, Stat } from "@/components/saha/shell";
import {
  aiInsights,
  bookings,
  categories,
  demandZones,
  inr,
  workers,
} from "@/lib/sahaseva-data";
import { setAccountStatus, useAccounts, type Account } from "@/lib/accounts";
import { useRequireRole } from "@/lib/session";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin · SahaSeva command centre" },
      {
        name: "description",
        content:
          "One admin dashboard for worker verification, societies, customers, bookings, payouts, welfare, complaints, fraud flags and AI analytics.",
      },
      { property: "og:title", content: "Admin · SahaSeva" },
      { property: "og:description", content: "The single SahaSeva admin command centre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

const complaints = [
  { id: "C-2201", by: "Customer", type: "Unexpected charge", ref: "SS-B-90155", state: "Under review" },
  { id: "C-2198", by: "Worker", type: "Customer unavailable", ref: "SS-B-90102", state: "Decision" },
  { id: "C-2190", by: "Customer", type: "No-show", ref: "SS-B-90088", state: "Resolved" },
];

const fraud = [
  "Account C-4471: 5 cancellations in 7 days — flagged for admin review.",
  "Worker W-1355: 3 five-star reviews from one device — flagged for admin review.",
  "Payment anomaly: repeated failed UPI attempts on booking SS-B-90211.",
];

const societyRows = [
  { name: "Sangareddy Labour Co-op Society", district: "Sangareddy", workers: 42, bookings: 318, rating: 4.7, payout: 437400 },
  { name: "Zaheerabad Rural Workers Society", district: "Sangareddy", workers: 31, bookings: 204, rating: 4.6, payout: 286100 },
  { name: "Medak Skilled Trades Co-op", district: "Medak", workers: 27, bookings: 176, rating: 4.5, payout: 241900 },
  { name: "Narayankhed Community Services Society", district: "Sangareddy", workers: 19, bookings: 92, rating: 4.4, payout: 118700 },
];

const levelTone = { High: "danger", Medium: "warning", Low: "success" } as const;

function PendingWorkerCard({ account }: { account: Account }) {
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const w = account.worker;

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{account.name}</p>
          <p className="text-xs text-muted-foreground">
            {account.email} · {account.mobile}
          </p>
        </div>
        <Pill tone={account.status === "PENDING" ? "warning" : "danger"}>
          {account.status === "PENDING" ? "Pending verification" : "Rejected"}
        </Pill>
      </div>

      <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
        <Detail k="Identity (KYC)" v={w?.kyc || "Aadhaar not uploaded"} />
        <Detail k="Membership ID" v={w?.membershipId || "—"} />
        <Detail k="Society" v={w?.society || "—"} />
        <Detail k="Skills" v={w?.skills || "—"} />
        <Detail k="Experience" v={w?.experience ? `${w.experience} years` : "—"} />
        <Detail k="Certificates" v={w?.certificates || "Not uploaded"} />
        <Detail k="Availability" v={`${w?.availabilityDays ?? "—"} · ${w?.availabilityTime ?? "—"}`} />
        <Detail k="Payout" v={w?.payout || "—"} />
        <Detail
          k="Address"
          v={`${account.address.village}, ${account.address.mandal}, ${account.address.district} - ${account.address.pincode}`}
        />
        <Detail k="Language" v={account.language} />
      </dl>

      {account.rejectionReason && (
        <p className="mt-2 rounded-xl bg-destructive/10 p-2 text-[11px] text-destructive">
          Rejection reason: {account.rejectionReason}
        </p>
      )}

      {rejecting ? (
        <div className="mt-3 space-y-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection"
            className="w-full rounded-xl border bg-card px-3 py-2 text-xs outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!reason.trim()) {
                  toast.error("Please enter a rejection reason.");
                  return;
                }
                setAccountStatus(account.email, "REJECTED", reason.trim());
                setRejecting(false);
                toast.error(`${account.name} rejected`);
              }}
              className="rounded-full bg-destructive px-3 py-1.5 text-[11px] font-bold text-destructive-foreground"
            >
              Confirm reject
            </button>
            <button
              onClick={() => setRejecting(false)}
              className="rounded-full border px-3 py-1.5 text-[11px] font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              setAccountStatus(account.email, "APPROVED");
              toast.success(`${account.name} approved — they can now sign in`);
            }}
            className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
          >
            Approve
          </button>
          <button
            onClick={() => setRejecting(true)}
            className="rounded-full border border-destructive/40 px-3 py-1.5 text-[11px] font-bold text-destructive"
          >
            Reject with reason
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-dashed py-1 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

function Admin() {
  const session = useRequireRole("ADMIN");
  const accounts = useAccounts();
  if (!session) return null;

  const workerAccounts = accounts.filter((a) => a.role === "WORKER");
  const pending = workerAccounts.filter((a) => a.status === "PENDING");
  const rejected = workerAccounts.filter((a) => a.status === "REJECTED");
  const approved = workerAccounts.filter((a) => a.status === "APPROVED");
  const customerAccounts = accounts.filter((a) => a.role === "CUSTOMER");

  return (
    <AdminShell title={session.name} subtitle="Single admin command centre">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total workers" value={String(1284 + workerAccounts.length)} />
        <Stat label="Total customers" value={String(18940 + customerAccounts.length)} />
        <Stat label="Societies" value="37" />
        <Stat label="Bookings (MTD)" value="9,412" />
        <Stat label="Pending approvals" value={String(pending.length)} tone="warning" />
        <Stat label="Transactions" value={inr(11840000)} />
        <Stat label="Open complaints" value="24" tone="warning" />
        <Stat label="Active users now" value="1,109" tone="success" />
      </div>

      <Panel
        title="Worker verification queue"
        action={
          <Pill tone={pending.length ? "warning" : "success"}>
            {pending.length} pending
          </Pill>
        }
      >
        {pending.length === 0 && rejected.length === 0 ? (
          <p className="rounded-xl bg-secondary p-3 text-xs text-secondary-foreground">
            No new worker registrations awaiting verification. New signups appear here instantly.
          </p>
        ) : (
          <div className="space-y-3">
            {[...pending, ...rejected].map((a) => (
              <PendingWorkerCard key={a.email} account={a} />
            ))}
          </div>
        )}
        {approved.length > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-success">
            <ShieldCheck className="h-3.5 w-3.5" /> {approved.length} worker
            {approved.length > 1 ? "s" : ""} approved and able to sign in.
          </p>
        )}
      </Panel>

      <Panel title="Worker management" action={<Pill tone="primary">All societies</Pill>}>
        <Table
          head={["Worker", "Category", "Society", "Verification", "Rating", "Jobs"]}
          rows={workers.map((w) => [
            <span className="font-semibold">{w.name}</span>,
            categories.find((c) => c.id === w.categoryId)?.name,
            w.society,
            <span className="flex flex-wrap gap-1">
              <Pill tone={w.verified.identity ? "success" : "warning"}>ID</Pill>
              <Pill tone={w.verified.member ? "success" : "warning"}>Member</Pill>
              <Pill tone={w.verified.skill ? "success" : "warning"}>Skill</Pill>
              <Pill tone={w.verified.certificate ? "success" : "warning"}>Cert</Pill>
            </span>,
            w.rating,
            w.jobs,
          ])}
        />
      </Panel>

      <Panel title="Societies" action={<Pill tone="primary">Approval & management</Pill>}>
        <Table
          head={["Society", "District", "Workers", "Bookings", "Rating", "Payouts"]}
          rows={societyRows.map((s) => [
            <span className="font-semibold">{s.name}</span>,
            s.district,
            s.workers,
            s.bookings,
            s.rating,
            inr(s.payout),
          ])}
        />
      </Panel>

      <Panel title="Customers & bookings">
        <Table
          head={["Booking", "Service", "Worker", "Customer", "Status", "Payment"]}
          rows={bookings.map((b) => [
            b.id,
            b.subservice,
            workers.find((w) => w.id === b.workerId)?.name,
            b.customer,
            b.emergency ? <Pill tone="danger">Emergency</Pill> : <Pill tone="primary">{b.status}</Pill>,
            <Pill tone={b.payment === "Paid" ? "success" : "warning"}>{b.payment}</Pill>,
          ])}
        />
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Payments & payouts">
          <div className="space-y-1.5 text-sm">
            <Row k="Service value (MTD)" v={inr(11840000)} />
            <Row k="Worker payouts (90%)" v={inr(10656000)} />
            <Row k="Cooperative contribution (6%)" v={inr(710400)} />
            <Row k="Platform fee (4%)" v={inr(473600)} />
            <div className="flex justify-between border-t pt-2 font-extrabold">
              <span>Pending payouts</span>
              <span>{inr(248500)}</span>
            </div>
          </div>
        </Panel>

        <Panel title="Complaints & disputes">
          <Table
            head={["ID", "Raised by", "Type", "Booking", "Stage"]}
            rows={complaints.map((c) => [
              c.id,
              c.by,
              c.type,
              c.ref,
              <Pill tone={c.state === "Resolved" ? "success" : "warning"}>{c.state}</Pill>,
            ])}
          />
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Fraud monitoring">
          <ul className="space-y-2">
            {fraud.map((f) => (
              <li
                key={f}
                className="flex gap-2 rounded-xl bg-destructive/8 p-3 text-xs text-destructive"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Flags are advisory only — no account is ever suspended automatically.
          </p>
        </Panel>

        <Panel title="AI analytics">
          <ul className="space-y-2">
            {aiInsights.map((i) => (
              <li key={i} className="flex gap-2 rounded-xl bg-secondary p-3 text-xs text-secondary-foreground">
                <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {i}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Welfare & training">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Insured workers" value="1,104 / 1,284" />
            <Stat label="Renewals due" value="39" tone="warning" />
            <Stat label="Open welfare cases" value="16" />
            <Stat label="Training completions" value="148" tone="success" />
          </div>
        </Panel>

        <Panel title="Live demand map">
          <ul className="space-y-2">
            {demandZones.map((z) => (
              <li
                key={z.area + z.category}
                className="flex items-center justify-between rounded-xl border p-3 text-xs"
              >
                <span>
                  <b>{z.category}</b> · {z.area}
                  <span className="block text-muted-foreground">
                    {z.jobs} requests · {z.workers} active workers
                  </span>
                </span>
                <Pill tone={levelTone[z.level]}>{z.level}</Pill>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="System settings & reports">
        <div className="grid gap-2 text-xs md:grid-cols-3">
          {[
            "Commission split configuration (worker / cooperative / platform)",
            "Service catalogue and pricing bands",
            "Emergency response radius & SLA",
            "Language and notification templates",
            "Monthly society and district reports",
            "Audit log of every verification decision",
          ].map((item) => (
            <div key={item} className="rounded-xl border p-3">
              {item}
            </div>
          ))}
        </div>
      </Panel>
    </AdminShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
