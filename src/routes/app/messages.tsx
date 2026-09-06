import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/saha/shell";
import { bookings, workers } from "@/lib/sahaseva-data";

export const Route = createFileRoute("/app/messages")({
  head: () => ({
    meta: [
      { title: "Messages · SahaSeva" },
      {
        name: "description",
        content:
          "Booking-linked chat between customers and cooperative workers, without exposing private phone numbers.",
      },
      { property: "og:title", content: "Messages · SahaSeva" },
      { property: "og:description", content: "Safe, booking-linked conversations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Messages,
});

function Messages() {
  const active = bookings.find((b) => b.status === "On The Way")!;
  const worker = workers.find((w) => w.id === active.workerId)!;
  const [msgs, setMsgs] = useState([
    { me: false, t: "Namaste, I have accepted your tap repair booking." },
    { me: true, t: "Thank you. The leak is under the kitchen sink." },
    { me: false, t: "Understood. I am carrying a spare washer set. Reaching in 15 minutes." },
  ]);
  const [draft, setDraft] = useState("");

  return (
    <>
      <AppHeader title="Messages" subtitle={`${worker.name} · ${active.id}`} />
      <div className="flex min-h-[65vh] flex-col justify-between">
        <ul className="space-y-2 p-4">
          <li className="mx-auto w-fit rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
            Chat is linked to booking {active.id} · {active.subservice}
          </li>
          {msgs.map((m, i) => (
            <li
              key={i}
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.me
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-card shadow-card"
              }`}
            >
              {m.t}
            </li>
          ))}
        </ul>

        <div className="sticky bottom-16 border-t bg-card p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Calls are connected through a masked number.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              setMsgs((m) => [...m, { me: true, t: draft.trim() }]);
              setDraft("");
            }}
            className="flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message"
              className="w-full rounded-full border bg-background px-4 py-2.5 text-sm outline-none"
            />
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
