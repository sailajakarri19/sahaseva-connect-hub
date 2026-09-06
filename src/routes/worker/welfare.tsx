import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, FileText, HeartPulse, IndianRupee, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppHeader, Pill } from "@/components/saha/shell";

export const Route = createFileRoute("/worker/welfare")({
  head: () => ({
    meta: [
      { title: "My welfare · SahaSeva Worker" },
      {
        name: "description",
        content:
          "Insurance status, welfare schemes, skill training, financial support and welfare support requests for cooperative workers.",
      },
      { property: "og:title", content: "My welfare · SahaSeva Worker" },
      { property: "og:description", content: "Insurance, training and welfare support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welfare,
});

const requestTypes = ["Insurance issue", "Welfare issue", "Training", "Payment issue", "Work support", "Other"];

function Welfare() {
  return (
    <>
      <AppHeader title="My welfare" subtitle="Cooperative member benefits" />
      <div className="space-y-3 p-4">
        <Card icon={ShieldCheck} title="Insurance">
          <Pill tone="success">Active</Pill>
          <p className="mt-2 text-xs text-muted-foreground">
            Group accident & health cover · Telangana Labour Co-op Federation scheme · valid till
            31 Mar 2027. Renewal reminder 30 days before expiry.
          </p>
        </Card>

        <Card icon={HeartPulse} title="Welfare benefits">
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• Maternity & family support — eligible</li>
            <li>• Education assistance for children — eligible</li>
            <li>• Emergency medical fund — eligible after 2 years membership</li>
          </ul>
          <button
            onClick={() => toast.success("Support request drafted")}
            className="mt-2 text-xs font-bold text-primary"
          >
            Apply / request support
          </button>
        </Card>

        <Card icon={BookOpen} title="Training">
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• Advanced inverter & solar servicing — 3 days, Sangareddy</li>
            <li>• Electrical safety refresher — recommended for renewal</li>
          </ul>
          <button
            onClick={() => toast.success("Registered for training")}
            className="mt-2 text-xs font-bold text-primary"
          >
            Register
          </button>
        </Card>

        <Card icon={IndianRupee} title="Financial support">
          <p className="text-xs text-muted-foreground">
            Tool purchase loan and seasonal income support available through your society.
          </p>
        </Card>

        <Card icon={FileText} title="Documents">
          <p className="text-xs text-muted-foreground">
            Membership certificate, skill certificates and insurance card — visible only to you and
            your society admin.
          </p>
        </Card>

        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="text-sm font-bold">Raise a support request</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {requestTypes.map((t) => (
              <button
                key={t}
                onClick={() => toast.success(`${t} request submitted`)}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Submitted → Under review → More information / Approved → Resolved.
          </p>
        </section>
      </div>
    </>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof HeartPulse;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card">
      <h2 className="flex items-center gap-1.5 text-sm font-bold">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
