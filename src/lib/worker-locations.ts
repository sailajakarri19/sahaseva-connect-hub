/**
 * Registered service-area coordinates for cooperative workers.
 *
 * These are the coordinates each worker registered with their society (their
 * service-area base), persisted alongside the worker profile. Map markers use
 * these values — nothing is randomised per render. A worker's live position is
 * used instead whenever their device has shared one (see `workerLiveCoords`).
 */
import { workers } from "./sahaseva-data";
import { isValidCoords } from "./geo-utils";

export type LatLng = { lat: number; lng: number };

const REGISTERED: Record<string, LatLng> = {
  "SS-W-1042": { lat: 17.6255, lng: 78.0876 }, // Sangareddy Mandal
  "SS-W-1088": { lat: 17.5896, lng: 78.013 }, // Kondapur & nearby villages
  "SS-W-1123": { lat: 17.6805, lng: 77.6108 }, // Zaheerabad Town
  "SS-W-1187": { lat: 18.0457, lng: 78.2635 }, // Medak Town
  "SS-W-1206": { lat: 17.7124, lng: 77.5642 }, // Zaheerabad rural cluster
  "SS-W-1244": { lat: 18.0072, lng: 78.2201 }, // Medak Mandal
  "SS-W-1301": { lat: 17.8302, lng: 77.7508 }, // Narayankhed cluster
  "SS-W-1355": { lat: 17.8711, lng: 77.6902 }, // Narayankhed villages
};

const LIVE_KEY = "sahaseva.worker-coords";

/** Coordinates a worker's own device shared, keyed by worker id. */
export function workerLiveCoords(workerId: string): LatLng | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LIVE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, LatLng>;
    const c = all[workerId];
    return isValidCoords(c) ? c! : null;
  } catch {
    return null;
  }
}

export function saveWorkerLiveCoords(workerId: string, coords: LatLng) {
  if (typeof window === "undefined" || !isValidCoords(coords)) return;
  try {
    const raw = window.localStorage.getItem(LIVE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, LatLng>) : {};
    all[workerId] = { lat: coords.lat, lng: coords.lng };
    window.localStorage.setItem(LIVE_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}

/** Live device position when available, otherwise the registered base. */
export function workerCoords(workerId: string): LatLng | null {
  return workerLiveCoords(workerId) ?? REGISTERED[workerId] ?? null;
}

export const hasWorkerCoords = (workerId: string) => workerCoords(workerId) !== null;

/** Default map centre: the cooperative's head-office town. */
export const FALLBACK_CENTER: LatLng = { lat: 17.6255, lng: 78.0876 };

export const mappableWorkers = () =>
  workers
    .map((w) => ({ worker: w, coords: workerCoords(w.id) }))
    .filter((x): x is { worker: (typeof workers)[number]; coords: LatLng } => x.coords !== null);
