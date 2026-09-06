import type { Coords } from "./store";

export const isValidCoords = (c?: { lat: number; lng: number } | null): boolean =>
  !!c &&
  Number.isFinite(c.lat) &&
  Number.isFinite(c.lng) &&
  Math.abs(c.lat) <= 90 &&
  Math.abs(c.lng) <= 180 &&
  !(c.lat === 0 && c.lng === 0);

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km between two points. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export const formatKm = (km: number | null) => (km === null ? "—" : `${km} km`);

/** Rough travel time for local roads (~24 km/h average, minimum 5 min). */
export const estimateMinutes = (km: number) => Math.max(5, Math.round((km / 24) * 60));

export const formatCoordsShort = (c: Coords | { lat: number; lng: number }) =>
  `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
