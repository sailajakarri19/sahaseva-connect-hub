import { createFileRoute } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { AppHeader, Stat } from "@/components/saha/shell";
import { inr } from "@/lib/sahaseva-data";

export const Route = createFileRoute("/worker/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings · SahaSeva Worker" },
      {
        name: "description",
        content:
          "Daily, weekly and monthly earnings, pending and paid amounts, deductions and transaction history for cooperative workers.",
      },
      { property: "og:title", content: "Earnings · SahaSeva Worker" },
      { property: "og:description", content: "Transparent, fair-wage earnings breakdown." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Earnings,
});

const txns = [
  { id: "TXN-4471-99A2", s: "Electrical maintenance", d: "02 Aug", amt: 900, status: "Paid" },
  { id: "TXN-4390-71C4", s: "Inverter service", d: "28 Jul", amt: 520, status: "Paid" },
  { id: "TXN-4302-55B1", s: "Fan installation ×2", d: "24 Jul", amt: 700, status: "Paid" },
  { id: "TXN-4288-10D9", s: "Wiring check", d: "22 Jul", amt: 850, status: "Pending" },
];

function Earnings() {
  return (
    <>
      <AppHeader title="Earnings" subtitle="Cooperative payout account" />

      <div className="grid grid-cols-3 gap-2 p-4">
        <Stat label="Today" value={inr(1450)} tone="success" />
        <Stat label="This week" value={inr(7300)} />
        <Stat label="This month" value={inr(28450)} />
      </div>

      <div className="space-y-2 px-4">
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <Row k="Available balance" v={inr(6200)} bold />
          <Row k="Pending earnings" v={inr(850)} />
          <Row k="Paid this month" v={inr(21400)} />
          <Row k="Cooperative welfare contribution" v={`− ${inr(890)}`} />
          <Row k="Platform fee" v={`− ${inr(640)}`} />
        </div>

        <div className="flex items-start gap-2 rounded-2xl bg-success/10 p-3 text-xs font-medium text-success">
          <Scale className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <b>Fair Wage Check:</b> your average earning of ₹315 per visit is within the
            recommended range for certified electricians in this district.
          </span>
        </div>
      </div>

      <section className="p-4">
        <h2 className="mb-2 text-sm font-bold">Transaction history</h2>
        <ul className="divide-y rounded-2xl border bg-card shadow-card">
          {txns.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{t.s}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {t.d} · {t.id}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{inr(t.amt)}</p>
                <p
                  className={`text-[11px] font-semibold ${t.status === "Paid" ? "text-success" : "text-warning-foreground"}`}
                >
                  {t.status}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className={bold ? "text-base font-extrabold" : "font-semibold"}>{v}</span>
    </div>
  );
}
