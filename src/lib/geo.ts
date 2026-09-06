import { useCallback, useState } from "react";
import { reverseGeocode } from "./maps.functions";
import type { Coords } from "./store";

export const LOCATION_DENIED_MESSAGE =
  "Location permission was denied. Please enter your address manually or enable location permission.";

export type GeoState = {
  loading: boolean;
  coords: Coords | null;
  address: string | null;
  error: string | null;
  note: string | null;
};

const initial: GeoState = { loading: false, coords: null, address: null, error: null, note: null };

/**
 * Real browser Geolocation. No coordinates are ever invented — if the browser
 * cannot provide a position, the user is asked to type the address instead.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeoState>(initial);

  const detect = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ ...initial, error: "This device or browser cannot share a location. Please enter your address manually." });
      return;
    }
    setState({ ...initial, loading: true });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: Coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        try {
          const res = await reverseGeocode({ data: { lat: coords.lat, lng: coords.lng } });
          setState({
            loading: false,
            coords,
            address: res.address,
            error: null,
            note: res.message ?? null,
          });
        } catch {
          setState({
            loading: false,
            coords,
            address: null,
            error: null,
            note: "Your location was captured, but the address lookup service could not be reached. Please type the address.",
          });
        }
      },
      (err) => {
        setState({
          ...initial,
          error:
            err.code === err.PERMISSION_DENIED
              ? LOCATION_DENIED_MESSAGE
              : err.code === err.TIMEOUT
                ? "Getting your location took too long. Please try again or enter your address manually."
                : "Your location is unavailable right now. Please enter your address manually.",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  const reset = useCallback(() => setState(initial), []);

  return { ...state, detect, reset };
}

export const formatCoords = (c: Coords) => `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
