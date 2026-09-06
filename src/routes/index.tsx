import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  HeartPulse,
  IndianRupee,
  MapPin,
  Siren,
  Users,
} from "lucide-react";
import { Logo } from "@/components/saha/shell";
import { categories } from "@/lib/sahaseva-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SahaSeva — Trusted Services, Empowered Workers" },
      {
        name: "description",
        content:
          "SahaSeva is a cooperative-owned marketplace connecting households and institutions with verified cooperative workers across villages, towns and cities.",
      },
      { property: "og:title", content: "SahaSeva — Cooperative Gig Services Platform" },
      {
        property: "og:description",
        content:
          "Book verified cooperative workers for electrical, plumbing, cleaning, carpentry and more — with fair wages and worker welfare built in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const pillars = [
  { icon: BadgeCheck, title: "Verified cooperative workers", text: "Identity, skill, certificate and membership checks by the society." },
  { icon: IndianRupee, title: "Fair wages, transparent pricing", text: "Every invoice shows the worker share, cooperative fee and platform fee." },
  { icon: HeartPulse, title: "Worker welfare built in", text: "Insurance, training, financial support and welfare case tracking." },
  { icon: MapPin, title: "Rural to urban coverage", text: "Village → mandal → district matching that widens the radius intelligently." },
  { icon: BrainCircuit, title: "AI-assisted, human-decided", text: "Demand forecasting, smart matching and workforce allocation suggestions." },
  { icon: Users, title: "Cooperative-owned", text: "Societies and federations run their own workforce, finance and welfare." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <Link
          to="/auth"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </header>

      <section className="bg-brand text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="inline-flex rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
              Problem Statement 26089 · Cooperative Gig Services
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Trusted Services. Empowered Workers. Stronger Communities.
            </h1>
            <p className="mt-4 max-w-lg text-primary-foreground/85">
              SahaSeva connects households, shops, clinics, schools and institutions with
              verified workers from registered labour cooperative societies — with fair wages,
              insurance and welfare at the centre.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-float"
              >
                Enter the app <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-5 py-3 text-sm font-semibold"
              >
                <Siren className="h-4 w-4" /> Emergency service
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 self-center">
            {categories.slice(0, 6).map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur"
              >
                <p className="text-sm font-bold">{c.name}</p>
                <p className="mt-1 text-xs text-primary-foreground/75">
                  {c.subservices.length} services
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Not another gig app — a cooperative one
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl border bg-card p-5 shadow-card">
              <p.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-sm font-bold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t px-5 py-8 text-center text-xs text-muted-foreground">
        SahaSeva · Connecting communities with verified cooperative workers.
      </footer>
    </div>
  );
}
