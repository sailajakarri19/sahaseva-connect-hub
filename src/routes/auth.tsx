import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail } from "lucide-react";
import { Logo } from "@/components/saha/shell";
import { signIn } from "@/lib/session";
import { registerAccount, type Address, type WorkerDetails } from "@/lib/accounts";
import { demoAccounts, roleHome, roleLabel, societies } from "@/lib/sahaseva-data";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to SahaSeva" },
      {
        name: "description",
        content:
          "Sign in or register on SahaSeva as a customer or cooperative worker. Worker profiles are verified by the Admin before first login.",
      },
      { property: "og:title", content: "Sign in to SahaSeva" },
      {
        property: "og:description",
        content: "Role-based access for customers, cooperative workers and the SahaSeva admin.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Auth,
});

const languages = ["Telugu", "Hindi", "English", "Urdu", "Marathi"];

const emptyAddress: Address = {
  state: "Telangana",
  district: "",
  mandal: "",
  village: "",
  pincode: "",
  landmark: "",
};

const emptyWorker: WorkerDetails = {
  skills: "",
  experience: "",
  certificates: "",
  society: societies[0],
  membershipId: "",
  kyc: "",
  availabilityDays: "Mon – Sat",
  availabilityTime: "9 AM – 7 PM",
  payout: "",
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function FileField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type="file"
        onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
        className="w-full rounded-xl border bg-card px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold"
      />
      {value && (
        <span className="mt-1 block text-[11px] text-muted-foreground">Uploaded: {value}</span>
      )}
    </label>
  );
}

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("lakshmi@sahaseva.in");
  const [password, setPassword] = useState("DEMO1234");
  const [error, setError] = useState<string | null>(null);

  // registration state
  const [role, setRole] = useState<"CUSTOMER" | "WORKER">("CUSTOMER");
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    language: "Telugu",
  });
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [worker, setWorker] = useState<WorkerDetails>(emptyWorker);
  const [regError, setRegError] = useState<string | null>(null);
  const [regDone, setRegDone] = useState<"CUSTOMER" | "WORKER" | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = signIn(email, password);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    navigate({ to: roleHome[res.role] });
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!form.name || !form.mobile || !form.email || !form.password) {
      setRegError("Name, mobile, email and password are required.");
      return;
    }
    if (role === "WORKER" && (!worker.skills || !worker.membershipId)) {
      setRegError("Skills and cooperative membership ID are required for worker registration.");
      return;
    }
    const res = registerAccount({
      name: form.name,
      mobile: form.mobile,
      email: form.email,
      password: form.password,
      language: form.language,
      role,
      address,
      ...(role === "WORKER" ? { worker } : {}),
    });
    if ("error" in res) {
      setRegError(res.error);
      return;
    }
    setRegDone(role);
    setEmail(form.email.trim().toLowerCase());
    setPassword(form.password);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] px-5 py-8">
      <Logo />

      <h1 className="mt-8 text-2xl font-extrabold tracking-tight">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Trusted services. Empowered workers. Stronger communities.
      </p>

      <div className="mt-5 grid grid-cols-2 rounded-full border bg-muted p-1 text-sm font-semibold">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-full py-2 transition-colors ${
              mode === m ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
            }`}
          >
            {m === "login" ? "Sign in" : "Register"}
          </button>
        ))}
      </div>

      {mode === "login" ? (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="flex items-center gap-2 rounded-xl border bg-card px-3 py-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border bg-card px-3 py-3">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          {error && (
            <p className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}
          <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-card">
            Sign in <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Forgot password? A reset link is sent to your registered email or mobile.
          </p>
        </form>
      ) : regDone ? (
        <div className="mt-6 space-y-3">
          <div className="flex gap-2 rounded-xl border border-success/40 bg-success/10 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              {regDone === "CUSTOMER" ? (
                <>
                  <b>Account created and approved.</b> You can sign in right away.
                </>
              ) : (
                <>
                  <b>Registration submitted.</b> Your profile is under verification by Admin. You
                  will be able to login after Admin approval. Please wait.
                </>
              )}
            </span>
          </div>
          <button
            onClick={() => {
              setMode("login");
              setRegDone(null);
            }}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-card"
          >
            Go to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={submitRegister} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-muted p-1 text-xs font-semibold">
            {(["CUSTOMER", "WORKER"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-xl py-2 transition-colors ${
                  role === r ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
                }`}
              >
                {roleLabel[r]}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field
              label="Mobile"
              value={form.mobile}
              onChange={(v) => setForm({ ...form, mobile: v })}
              placeholder="10-digit mobile"
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
            />
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Preferred language
              </span>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none"
              >
                {languages.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border bg-card p-3">
            <p className="mb-2 text-xs font-bold">Address</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="State" value={address.state} onChange={(v) => setAddress({ ...address, state: v })} />
              <Field label="District" value={address.district} onChange={(v) => setAddress({ ...address, district: v })} />
              <Field label="Mandal" value={address.mandal} onChange={(v) => setAddress({ ...address, mandal: v })} />
              <Field label="Village / town" value={address.village} onChange={(v) => setAddress({ ...address, village: v })} />
              <Field label="Pincode" value={address.pincode} onChange={(v) => setAddress({ ...address, pincode: v })} />
              <Field label="Landmark" value={address.landmark} onChange={(v) => setAddress({ ...address, landmark: v })} />
            </div>
          </div>

          {role === "WORKER" && (
            <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs font-bold">Cooperative worker details</p>
              <Field
                label="Skills"
                value={worker.skills}
                onChange={(v) => setWorker({ ...worker, skills: v })}
                placeholder="Fan repair, wiring…"
              />
              <Field
                label="Experience (years)"
                value={worker.experience}
                onChange={(v) => setWorker({ ...worker, experience: v })}
              />
              <FileField
                label="Certificates"
                value={worker.certificates}
                onChange={(v) => setWorker({ ...worker, certificates: v })}
              />
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Cooperative society
                </span>
                <select
                  value={worker.society}
                  onChange={(e) => setWorker({ ...worker, society: e.target.value })}
                  className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none"
                >
                  {societies.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <Field
                label="Membership ID"
                value={worker.membershipId}
                onChange={(v) => setWorker({ ...worker, membershipId: v })}
              />
              <FileField
                label="KYC (Aadhaar upload)"
                value={worker.kyc}
                onChange={(v) => setWorker({ ...worker, kyc: v })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Available days"
                  value={worker.availabilityDays}
                  onChange={(v) => setWorker({ ...worker, availabilityDays: v })}
                />
                <Field
                  label="Available time"
                  value={worker.availabilityTime}
                  onChange={(v) => setWorker({ ...worker, availabilityTime: v })}
                />
              </div>
              <Field
                label="Payout details (Bank / UPI)"
                value={worker.payout}
                onChange={(v) => setWorker({ ...worker, payout: v })}
                placeholder="name@upi or account number"
              />
              <p className="text-[11px] text-muted-foreground">
                Worker accounts stay pending until the Admin verifies identity, membership, skills
                and certificates.
              </p>
            </div>
          )}

          {regError && (
            <p className="flex items-center gap-2 text-xs font-medium text-destructive">
              <AlertCircle className="h-4 w-4" /> {regError}
            </p>
          )}

          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-card">
            Create account <ArrowRight className="h-4 w-4" />
          </button>

          <p className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs font-medium text-warning-foreground">
            Admin accounts are never created through public signup.
          </p>
        </form>
      )}

      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Demo accounts (password: DEMO1234)
        </p>
        <div className="mt-3 space-y-2">
          {demoAccounts.map((a) => (
            <button
              key={a.email}
              onClick={() => {
                setMode("login");
                setEmail(a.email);
                setPassword(a.password);
                setError(null);
              }}
              className="flex w-full items-center justify-between rounded-xl border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted"
            >
              <span>
                <span className="block text-sm font-semibold">{a.name}</span>
                <span className="block text-xs text-muted-foreground">{a.email}</span>
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                {roleLabel[a.role]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
