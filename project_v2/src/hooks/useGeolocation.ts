import { useCallback, useEffect, useState } from 'react';

export type GeoStatus = 'detecting' | 'ok' | 'denied' | 'unavailable';

export interface GeoResult {
  status: GeoStatus;
  latitude: number;
  longitude: number;
  /** Human-readable place name, resolved via reverse geocoding when possible. */
  locationName: string;
  retry: () => void;
}

// Fallback used only when GPS is denied/unavailable, so the citizen can
// still submit a report (matches the PDF's "capture GPS automatically"
// flow, with a safe default rather than blocking submission entirely).
const FALLBACK = { latitude: 33.6844, longitude: 73.0479, name: 'Islamabad, Pakistan' };

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

export function useGeolocation(): GeoResult {
  const [status, setStatus] = useState<GeoStatus>('detecting');
  const [coords, setCoords] = useState({ latitude: FALLBACK.latitude, longitude: FALLBACK.longitude });
  const [locationName, setLocationName] = useState(FALLBACK.name);

  const detect = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    setStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setStatus('ok');
        const name = await reverseGeocode(latitude, longitude);
        setLocationName(name || `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

  return { status, latitude: coords.latitude, longitude: coords.longitude, locationName, retry: detect };
}
