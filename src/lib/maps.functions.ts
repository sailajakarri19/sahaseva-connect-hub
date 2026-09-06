import { createServerFn } from "@tanstack/react-start";

/**
 * Location + routing services.
 *
 * Google Maps is used whenever GOOGLE_MAPS_API_KEY is configured (server-side
 * only — the key is never shipped to the browser). Without a key the app still
 * works using OpenStreetMap's public Nominatim/OSRM services, so addresses,
 * search and routes are real rather than simulated. Every function degrades to
 * a clear message instead of throwing, so the UI never crashes.
 */

const UA = { "User-Agent": "SahaSeva-Connect/1.0 (cooperative services app)" };

export type GeoResult = {
  configured: boolean;
  address: string | null;
  message?: string;
};

export type PlaceResult = {
  name: string;
  lat: number;
  lng: number;
};

export type RouteResult = {
  configured: boolean;
  distanceKm: number | null;
  durationMin: number | null;
  /** Route geometry as [lat, lng] pairs, empty when only a straight line is known. */
  path: [number, number][];
  source: "google" | "osrm" | "straight-line";
  message?: string;
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

const validPoint = (p: unknown): p is { lat: number; lng: number } => {
  const o = p as { lat?: unknown; lng?: unknown } | null;
  return (
    !!o &&
    num(o.lat) !== null &&
    num(o.lng) !== null &&
    Math.abs(o.lat as number) <= 90 &&
    Math.abs(o.lng as number) <= 180
  );
};

/* --------------------------------------------------------- reverse geocode */

export const reverseGeocode = createServerFn({ method: "POST" })
  .validator((input: { lat: number; lng: number }) => {
    if (!validPoint(input)) throw new Error("Invalid coordinates");
    return { lat: input.lat, lng: input.lng };
  })
  .handler(async ({ data }): Promise<GeoResult> => {
    const key = process.env["GOOGLE_MAPS_API_KEY"];
    if (key) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${data.lat},${data.lng}&key=${key}`,
        );
        const json = (await res.json()) as { results?: { formatted_address?: string }[] };
        const address = json.results?.[0]?.formatted_address ?? null;
        if (address) return { configured: true, address };
      } catch {
        /* fall through to OpenStreetMap */
      }
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${data.lat}&lon=${data.lng}`,
        { headers: UA },
      );
      const json = (await res.json()) as { display_name?: string };
      if (json.display_name) return { configured: Boolean(key), address: json.display_name };
      return {
        configured: Boolean(key),
        address: null,
        message: "No readable address was found for this location.",
      };
    } catch {
      return {
        configured: Boolean(key),
        address: null,
        message: "The address lookup service could not be reached. Please type the address.",
      };
    }
  });

/* ---------------------------------------------------------- place search */

export const searchPlaces = createServerFn({ method: "POST" })
  .validator((input: { query: string }) => {
    const q = String(input?.query ?? "").trim().slice(0, 120);
    if (q.length < 3) throw new Error("Search text is too short");
    return { query: q };
  })
  .handler(async ({ data }): Promise<{ results: PlaceResult[]; message?: string }> => {
    const key = process.env["GOOGLE_MAPS_API_KEY"];
    if (key) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(data.query)}&key=${key}`,
        );
        const json = (await res.json()) as {
          results?: { formatted_address?: string; geometry?: { location?: { lat: number; lng: number } } }[];
        };
        const results = (json.results ?? [])
          .map((r) => ({
            name: r.formatted_address ?? data.query,
            lat: r.geometry?.location?.lat ?? NaN,
            lng: r.geometry?.location?.lng ?? NaN,
          }))
          .filter((r) => validPoint(r))
          .slice(0, 6);
        if (results.length > 0) return { results };
      } catch {
        /* fall through */
      }
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(data.query)}`,
        { headers: UA },
      );
      const json = (await res.json()) as { display_name?: string; lat?: string; lon?: string }[];
      const results = (Array.isArray(json) ? json : [])
        .map((r) => ({
          name: r.display_name ?? data.query,
          lat: Number(r.lat),
          lng: Number(r.lon),
        }))
        .filter((r) => validPoint(r));
      if (results.length === 0) return { results: [], message: "No place matched that search." };
      return { results };
    } catch {
      return { results: [], message: "The place search service could not be reached." };
    }
  });

/* ------------------------------------------------------------------ route */

export const routeBetween = createServerFn({ method: "POST" })
  .validator((input: { from: { lat: number; lng: number }; to: { lat: number; lng: number } }) => {
    if (!validPoint(input?.from) || !validPoint(input?.to)) throw new Error("Invalid coordinates");
    return { from: input.from, to: input.to };
  })
  .handler(async ({ data }): Promise<RouteResult> => {
    const key = process.env["GOOGLE_MAPS_API_KEY"];
    if (key) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${data.from.lat},${data.from.lng}&destination=${data.to.lat},${data.to.lng}&key=${key}`,
        );
        const json = (await res.json()) as {
          routes?: {
            overview_polyline?: { points?: string };
            legs?: { distance?: { value: number }; duration?: { value: number } }[];
          }[];
        };
        const route = json.routes?.[0];
        const leg = route?.legs?.[0];
        if (leg?.distance && leg.duration) {
          return {
            configured: true,
            distanceKm: Math.round((leg.distance.value / 1000) * 10) / 10,
            durationMin: Math.round(leg.duration.value / 60),
            path: decodePolyline(route?.overview_polyline?.points ?? ""),
            source: "google",
          };
        }
      } catch {
        /* fall through to OSRM */
      }
    }
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${data.from.lng},${data.from.lat};${data.to.lng},${data.to.lat}?overview=full&geometries=geojson`,
      );
      const json = (await res.json()) as {
        routes?: {
          distance?: number;
          duration?: number;
          geometry?: { coordinates?: [number, number][] };
        }[];
      };
      const r = json.routes?.[0];
      if (r?.distance !== undefined && r.duration !== undefined) {
        return {
          configured: Boolean(key),
          distanceKm: Math.round((r.distance / 1000) * 10) / 10,
          durationMin: Math.round(r.duration / 60),
          path: (r.geometry?.coordinates ?? []).map(([lng, lat]) => [lat, lng] as [number, number]),
          source: "osrm",
        };
      }
      return {
        configured: Boolean(key),
        distanceKm: null,
        durationMin: null,
        path: [],
        source: "straight-line",
        message: "No road route was found between these points.",
      };
    } catch {
      return {
        configured: Boolean(key),
        distanceKm: null,
        durationMin: null,
        path: [],
        source: "straight-line",
        message: "Live route service unavailable — showing the direct line and estimated distance.",
      };
    }
  });

/** Google encoded-polyline decoder (returns [lat, lng] pairs). */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}
