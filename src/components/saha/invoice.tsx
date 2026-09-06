import { Download, Printer, X } from "lucide-react";
import { Pill } from "@/components/saha/shell";
import { inr, workers, categories } from "@/lib/sahaseva-data";
import { bookingTotal, type BookingRecord } from "@/lib/store";

const dt = (n?: number) =>
  n ? new Date(n).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export function InvoiceBody({ b }: { b: BookingRecord }) {
  const w = workers.find((x) => x.id === b.workerId);
  const cat = categories.find((c) => c.id === b.categoryId);
  return (
    <div id={`invoice-${b.id}`} className="text-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-extrabold">SahaSeva Connect</p>
          <p className="text-[11px] text-muted-foreground">
            Cooperative Services Platform · Sangareddy, Telangana
          </p>
          <p className="text-[11px] text-muted-foreground">support@sahaseva.in · GSTIN 36AAACS0000A1Z5</p>
        </div>
        <div className="text-right text-[11px] text-muted-foreground">
          <p className="font-bold text-foreground">Invoice</p>
          <p>{b.id}</p>
          <p>{dt(b.createdAt)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
        <div>
          <p className="font-bold">Billed to</p>
          <p className="text-muted-foreground">{b.customerName}</p>
          <p className="text-muted-foreground">{b.address}</p>
          {b.coords && (
            <p className="text-muted-foreground">
              {b.coords.lat.toFixed(5)}, {b.coords.lng.toFixed(5)}
            </p>
          )}
        </div>
        <div>
          <p className="font-bold">Service by</p>
          <p className="text-muted-foreground">{w?.name}</p>
          <p className="text-muted-foreground">{w?.society}</p>
          <p className="text-muted-foreground">Member {w?.membershipId}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1 border-t pt-3 text-xs">
        <Row k="Service" v={`${cat?.name ?? ""} · ${b.subservice}`} />
        <Row k="Scheduled" v={`${new Date(b.startAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} · ${b.slot}`} />
        <Row k="Status" v={b.status} />
        {b.emergency && <Row k="Priority" v="Emergency" />}
      </div>

      <div className="mt-3 space-y-1 border-t pt-3">
        <Row k="Service charge" v={inr(b.amount)} />
        <Row k="Materials" v={inr(b.materials)} />
        <Row k="Cooperative contribution" v={inr(b.coopFee)} />
        <Row k="Platform fee" v={inr(b.platformFee)} />
      </div>
      <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-extrabold">
        <span>Total payable</span>
        <span>{inr(bookingTotal(b))}</span>
      </div>

      <div className="mt-3 space-y-1 border-t pt-3 text-xs">
        <Row k="Payment method" v={b.paymentMethod ?? "—"} />
        <Row k="Payment status" v={b.payment} />
        <Row k="Transaction ID" v={b.txn ?? "—"} />
        <Row k="Paid at" v={dt(b.paidAt)} />
      </div>
      {b.demoPayment && (
        <p className="mt-3 rounded-lg bg-warning/15 p-2 text-[11px] font-semibold text-warning-foreground">
          Demo Payment Mode — this transaction was simulated and no money was transferred.
        </p>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        Worker earnings are paid to the cooperative society account under fair-wage norms. Thank you
        for supporting cooperative labour.
      </p>
    </div>
  );
}

export function InvoiceSheet({ b, onClose }: { b: BookingRecord; onClose: () => void }) {
  const print = () => window.print();
  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-foreground/40 md:place-items-center print:static print:bg-transparent">
      <div className="max-h-[85vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-card p-5 md:rounded-3xl print:max-h-none print:overflow-visible print:rounded-none">
        <div className="mb-3 flex justify-end gap-2 print:hidden">
          <button
            onClick={print}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button
            onClick={print}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" /> Save as PDF
          </button>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full border">
            <X className="h-4 w-4" />
          </button>
        </div>
        <InvoiceBody b={b} />
        <div className="mt-4 print:hidden">
          <Pill tone={b.payment === "Paid" ? "success" : "warning"}>{b.payment}</Pill>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}
