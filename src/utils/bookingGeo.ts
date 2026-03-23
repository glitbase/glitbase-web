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

/**
 * Extract { lat, lng } from common API shapes (flat fields, GeoJSON Point, etc.).
 */
export function extractLatLngFromLocation(loc: unknown): { lat: number; lng: number } | null {
  if (loc == null || typeof loc !== "object") return null;
  const o = loc as Record<string, unknown>;

  const lat = o.lat ?? o.latitude;
  const lng = o.lng ?? o.longitude ?? o.lon;
  if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  if (typeof lat === "string" && typeof lng === "string") {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (Number.isFinite(la) && Number.isFinite(ln)) return { lat: la, lng: ln };
  }

  const coords = o.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    const a = Number(coords[0]);
    const b = Number(coords[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    // GeoJSON Point: [longitude, latitude]
    if (Math.abs(a) <= 180 && Math.abs(b) <= 90) {
      return { lng: a, lat: b };
    }
  }

  const geometry = o.geometry;
  if (geometry && typeof geometry === "object") {
    const g = geometry as Record<string, unknown>;
    const gc = g.coordinates;
    if (Array.isArray(gc) && gc.length >= 2) {
      const a = Number(gc[0]);
      const b = Number(gc[1]);
      if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 180 && Math.abs(b) <= 90) {
        return { lng: a, lat: b };
      }
    }
  }

  return null;
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
