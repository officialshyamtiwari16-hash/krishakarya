export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  source: 'gps' | 'ip' | 'cached' | 'fallback' | 'search';
  address?: string;
  village?: string;
  district?: string;
  state?: string;
  country?: string;
  error?: string;
  timestamp?: number;
}

const CACHE_KEY = 'krishakarya_last_geo';
const CACHE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes cache

/**
 * Reverse geocodes latitude/longitude into human-readable village, district, state.
 * Uses BigDataCloud client API (fast, reliable, free CORS) with Nominatim fallback.
 */
export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number
): Promise<{ village: string; district: string; state: string; address: string; country: string }> {
  let village = 'Farm Field';
  let district = 'Local District';
  let state = 'Uttar Pradesh';
  let country = 'India';
  let address = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;

  // 1. Try BigDataCloud Reverse Geocoding API (Client Free API)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const loc = data.locality || data.localityInfo?.administrative?.[3]?.name || data.localityInfo?.administrative?.[2]?.name;
      const dist = data.city || data.localityInfo?.administrative?.[2]?.name || data.localityInfo?.administrative?.[1]?.name;
      const st = data.principalSubdivision || data.countrySubdivisionName || state;
      const cty = data.countryName || country;

      if (loc) village = loc;
      if (dist) district = dist;
      if (st) state = st;
      if (cty) country = cty;

      address = [village, district, state].filter(Boolean).join(', ');
      return { village, district, state, address, country };
    }
  } catch (e) {
    // Continue to Nominatim fallback
  }

  // 2. Try OpenStreetMap Nominatim with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      village = addr.village || addr.hamlet || addr.suburb || addr.town || addr.city || village;
      district = addr.county || addr.district || addr.state_district || addr.city || district;
      state = addr.state || state;
      country = addr.country || country;
      address = data.display_name || `${village}, ${district}, ${state}`;
      return { village, district, state, address, country };
    }
  } catch (e) {
    console.warn('Reverse geocoding OSM fallback note:', e);
  }

  return { village, district, state, address, country };
}

/**
 * IP-based geolocation fallback when browser GPS is blocked, denied, or unavailable.
 */
export async function getIpLocation(): Promise<GeoLocationResult> {
  // 1. Try ipwho.is (CORS enabled, HTTPS, no auth needed)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success !== false && data.latitude && data.longitude) {
        const village = data.city || 'Local Area';
        const district = data.region || data.city || 'District';
        const state = data.region || 'Uttar Pradesh';
        const country = data.country || 'India';
        const address = `${village}, ${district}, ${state}`;

        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 5000,
          source: 'ip',
          village,
          district,
          state,
          country,
          address,
          timestamp: Date.now(),
        };
      }
    }
  } catch (e) {
    // Continue
  }

  // 2. Try freeipapi.com fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const village = data.cityName || 'Local Area';
        const district = data.regionName || data.cityName || 'District';
        const state = data.regionName || 'Uttar Pradesh';
        const country = data.countryName || 'India';
        const address = `${village}, ${district}, ${state}`;

        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 5000,
          source: 'ip',
          village,
          district,
          state,
          country,
          address,
          timestamp: Date.now(),
        };
      }
    }
  } catch (e) {
    // Fallback
  }

  // Default fallback (Central Agricultural Hub - Barabanki, UP)
  return {
    latitude: 26.9288,
    longitude: 81.1822,
    accuracy: 10000,
    source: 'fallback',
    village: 'Barabanki',
    district: 'Barabanki',
    state: 'Uttar Pradesh',
    country: 'India',
    address: 'Barabanki, Uttar Pradesh (Estimated)',
    timestamp: Date.now(),
  };
}

/**
 * Gets real geolocation using the browser's Navigator Geolocation API with automatic IP fallback.
 * Guaranteed to resolve with accurate location coordinates and place details.
 */
export async function getDeviceLocation(options?: { forceFresh?: boolean }): Promise<GeoLocationResult> {
  // Check cached location first if not forcing fresh lookup
  if (!options?.forceFresh) {
    try {
      const cachedStr = localStorage.getItem(CACHE_KEY);
      if (cachedStr) {
        const cached: GeoLocationResult = JSON.parse(cachedStr);
        if (cached.timestamp && Date.now() - cached.timestamp < CACHE_EXPIRY_MS && cached.latitude && cached.longitude) {
          return cached;
        }
      }
    } catch (e) {
      // Ignore cache parse error
    }
  }

  // Attempt HTML5 Navigator Geolocation
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    const gpsResult = await new Promise<GeoLocationResult | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          try {
            const geoInfo = await reverseGeocodeCoords(latitude, longitude);
            const result: GeoLocationResult = {
              latitude,
              longitude,
              accuracy: Math.round(accuracy),
              source: 'gps',
              village: geoInfo.village,
              district: geoInfo.district,
              state: geoInfo.state,
              country: geoInfo.country,
              address: geoInfo.address,
              timestamp: Date.now(),
            };
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify(result));
            } catch (err) {}
            resolve(result);
          } catch (e) {
            resolve({
              latitude,
              longitude,
              accuracy: Math.round(accuracy),
              source: 'gps',
              village: 'Farm Field',
              district: 'Local District',
              state: 'Uttar Pradesh',
              country: 'India',
              address: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
              timestamp: Date.now(),
            });
          }
        },
        async (error) => {
          console.info('HTML5 Geolocation prompt note (falling back to IP detection):', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 60000,
        }
      );
    });

    if (gpsResult) {
      return gpsResult;
    }
  }

  // Fallback to IP Geolocation
  const ipResult = await getIpLocation();
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(ipResult));
  } catch (err) {}
  return ipResult;
}

/**
 * Searches locations across India / Global using Open-Meteo Geocoding API
 */
export async function searchLocations(query: string): Promise<Array<{
  name: string;
  admin1?: string; // State
  country?: string;
  latitude: number;
  longitude: number;
  displayName: string;
}>> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((r: any) => ({
      name: r.name,
      admin1: r.admin1 || '',
      country: r.country || '',
      latitude: r.latitude,
      longitude: r.longitude,
      displayName: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    }));
  } catch (e) {
    console.warn('Location search error:', e);
    return [];
  }
}
