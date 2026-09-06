export type Slot = { label: string; startHour: number; endHour: number };

export const SLOTS: Slot[] = [
  { label: "8–10 AM", startHour: 8, endHour: 10 },
  { label: "10–12 PM", startHour: 10, endHour: 12 },
  { label: "12–2 PM", startHour: 12, endHour: 14 },
  { label: "2–4 PM", startHour: 14, endHour: 16 },
  { label: "4–6 PM", startHour: 16, endHour: 18 },
  { label: "6–8 PM", startHour: 18, endHour: 20 },
];

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

export const dayLabel = (d: Date) => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000);
  if (isSameDay(d, now)) return "Today";
  if (isSameDay(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
};

export const fullDateLabel = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Slot is selectable only if its window has not already passed today. */
export const slotAvailable = (d: Date, slot: Slot) => {
  const now = new Date();
  if (!isSameDay(d, now)) return startOfDay(d).getTime() >= startOfDay(now).getTime();
  return now.getHours() < slot.endHour;
};

export const slotStartAt = (d: Date, slot: Slot) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), slot.startHour, 0, 0, 0).getTime();

export const to24h = (hour12: number, minute: number, meridiem: "AM" | "PM") => {
  const h = meridiem === "AM" ? (hour12 === 12 ? 0 : hour12) : hour12 === 12 ? 12 : hour12 + 12;
  return { hour: h, minute };
};

export const customStartAt = (d: Date, hour12: number, minute: number, meridiem: "AM" | "PM") => {
  const { hour, minute: m } = to24h(hour12, minute, meridiem);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, m, 0, 0).getTime();
};

export const timeLabel = (hour12: number, minute: number, meridiem: "AM" | "PM") =>
  `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
