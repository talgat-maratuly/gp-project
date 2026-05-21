import { MovementState, OrderStatus } from '@prisma/client';

export const CLIENT_GEOFENCE_RADIUS_M = 80;
export const CLIENT_DWELL_SEC = 180;
export const DISPOSAL_DWELL_SEC = 120;
export const MOVING_SPEED_KMH = 8;
export const MOVING_DISTANCE_M = 40;

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineKm(lat1, lng1, lat2, lng2) * 1000;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function pointInCircle(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusM: number,
): boolean {
  return haversineMeters(lat, lng, centerLat, centerLng) <= radiusM;
}

type PolygonPoint = [number, number];

export function pointInPolygon(lat: number, lng: number, polygon: PolygonPoint[]): boolean {
  if (!polygon?.length || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];
    const intersect =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI + 1e-12) + latI;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function inGeofenceZone(
  lat: number,
  lng: number,
  zone: { lat: number; lng: number; radiusM: number; polygon?: unknown },
): boolean {
  if (zone.polygon && Array.isArray(zone.polygon)) {
    const poly = zone.polygon as PolygonPoint[];
    if (poly.length >= 3) return pointInPolygon(lat, lng, poly);
  }
  return pointInCircle(lat, lng, zone.lat, zone.lng, zone.radiusM);
}

export function detectMovement(
  prevLat: number | null,
  prevLng: number | null,
  lat: number,
  lng: number,
  speedKmh?: number | null,
): MovementState {
  if (speedKmh != null && speedKmh >= MOVING_SPEED_KMH) return MovementState.MOVING;
  if (prevLat == null || prevLng == null) return MovementState.IDLE;
  const dist = haversineMeters(prevLat, prevLng, lat, lng);
  if (dist >= MOVING_DISTANCE_M) return MovementState.MOVING;
  if (dist < 5) return MovementState.STOPPED;
  return MovementState.IDLE;
}

export function estimateEtaMinutes(distanceKm: number, speedKmh = 35): number {
  if (distanceKm <= 0) return 0;
  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
}

/** Автоматический переход статуса для септика по GPS */
export const SEPTIC_GPS_FLOW: OrderStatus[] = [
  OrderStatus.ACCEPTED,
  OrderStatus.ON_THE_WAY,
  OrderStatus.ARRIVED,
  OrderStatus.STARTED,
  OrderStatus.LOADED,
  OrderStatus.DISPOSAL_ARRIVED,
  OrderStatus.DISPOSAL_COMPLETED,
  OrderStatus.COMPLETED,
];

export function isSepticGpsManaged(status: OrderStatus): boolean {
  return SEPTIC_GPS_FLOW.includes(status) || status === OrderStatus.CLIENT_CONFIRMED;
}
