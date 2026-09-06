import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  Home,
  IndianRupee,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Shield,
  User,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignOut } from "@/lib/session";
import { useInbox } from "@/lib/notification-inbox";
import { useUnreadCount } from "@/lib/store";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-primary-foreground shadow-card">
        <Shield className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-base font-extrabold tracking-tight">SahaSeva</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Cooperative Services
          </p>
        </div>
      )}
    </div>
  );
}

export function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-background pb-24 shadow-card md:my-4 md:min-h-[calc(100vh-2rem)] md:rounded-3xl md:border">
      {children}
    </div>
  );
}

export function AppHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string | undefined;
  right?: ReactNode | undefined;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-card/90 px-4 py-3 backdrop-blur md:rounded-t-3xl">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{right}</div>
    </header>
  );
}

export function SignOutButton() {
  const out = useSignOut();
  return (
    <button
      onClick={out}
      aria-label="Sign out"
      className="grid h-9 w-9 place-items-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}

export function NotificationsButton({ count }: { count?: number }) {
  const inbox = useInbox();
  const live = useUnreadCount(inbox);
  const unread = count ?? live;
  return (
    <Link
      to="/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative grid h-9 w-9 place-items-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted"
    >
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}


type NavItem = { to: string; label: string; icon: typeof Home };

const customerNav: NavItem[] = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/services", label: "Services", icon: LayoutGrid },
  { to: "/app/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/app/messages", label: "Messages", icon: MessageSquare },
  { to: "/app/profile", label: "Profile", icon: User },
];

const workerNav: NavItem[] = [
  { to: "/worker", label: "Home", icon: Home },
  { to: "/worker/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { to: "/worker/earnings", label: "Earnings", icon: IndianRupee },
  { to: "/worker/welfare", label: "Welfare", icon: HeartPulse },
  { to: "/worker/profile", label: "Profile", icon: User },
];

export function BottomNav({ variant }: { variant: "customer" | "worker" }) {
  const items = variant === "customer" ? customerNav : workerNav;
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:rounded-b-3xl">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = path === it.to;
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-4 py-3">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-card">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-xl font-extrabold tracking-tight", toneClass)}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "success" | "warning" | "danger" | "accent";
}) {
  const map = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-secondary text-secondary-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/18 text-warning-foreground",
    danger: "bg-destructive/12 text-destructive",
    accent: "bg-accent/20 text-accent-foreground",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}
