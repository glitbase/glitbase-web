/** Max distance (meters) from store for customer "I'm here" check-in */
export const STORE_CHECKIN_RADIUS_METERS = 100;

/**
 * Haversine distance in meters between two WGS84 points.
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isServiceDateToday(serviceDate: string | undefined): boolean {
  if (!serviceDate) return false;
  const d = serviceDate.split("T")[0];
  const today = new Date().toLocaleDateString("en-CA");
  return d === today;
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });
  });
}

/**
 * User-facing copy for browser GeolocationPositionError (codes 1–3).
 * Code 2 ("Position update is unavailable") = OS/GPS could not produce a fix — not a permissions UI issue.
 */
export function geolocationFailureMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as GeolocationPositionError).code;
    if (code === 1) {
      return "Location permission is needed to verify you're at the store.";
    }
    if (code === 2) {
      return "Your device couldn't get a location fix (GPS/signal or system Location off). Try again near a window, enable Location for this browser in system settings, or disable VPN.";
    }
    if (code === 3) {
      return "Location request timed out. Please try again.";
    }
  }
  if (err instanceof Error && err.message === "Geolocation is not supported") {
    return "This browser doesn't support location.";
  }
  return "Could not read your location.";
}
