export interface CheckoutAddressFields {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode?: string;
}

export interface LocationSuggestion {
  id: string;
  label: string;
  detail: string;
  lat: number;
  lon: number;
  fields: CheckoutAddressFields;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  state_district?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

interface NominatimResult {
  place_id?: number;
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimAddress;
}

const NOMINATIM_BASE = (
  import.meta.env.VITE_NOMINATIM_URL || '/api/nominatim'
).replace(/\/$/, '');

function nominatimUrl(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `${NOMINATIM_BASE}${path}?${query.toString()}`;
}

function streetLine(addr: NominatimAddress | undefined, fallback: string) {
  if (!addr) return fallback;
  const street = [addr.house_number, addr.road || addr.pedestrian].filter(Boolean).join(' ');
  return street || addr.neighbourhood || addr.suburb || fallback;
}

function cityName(addr: NominatimAddress | undefined) {
  if (!addr) return '';
  return addr.city || addr.town || addr.village || addr.hamlet || '';
}

function toFields(result: NominatimResult): CheckoutAddressFields {
  const addr = result.address;
  return {
    address: streetLine(addr, result.display_name?.split(',')[0]?.trim() || ''),
    city: cityName(addr),
    state: addr?.state || addr?.state_district || addr?.county || '',
    postalCode: addr?.postcode || '',
    country: addr?.country || '',
    countryCode: addr?.country_code ? addr.country_code.toUpperCase() : undefined,
  };
}

function suggestionDetail(fields: CheckoutAddressFields) {
  return [fields.city, fields.state, fields.country].filter(Boolean).join(', ');
}

async function nominatimFetch(url: string, signal?: AbortSignal): Promise<unknown> {
  const request = async (target: string) => {
    const response = await fetch(target, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Location lookup failed.');
    return response.json();
  };

  try {
    return await request(url);
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    if (url.startsWith('/api/nominatim')) {
      return request(url.replace('/api/nominatim', 'https://nominatim.openstreetmap.org'));
    }
    throw err;
  }
}

export async function searchLocations(query: string, signal?: AbortSignal): Promise<LocationSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const data = (await nominatimFetch(
    nominatimUrl('/search', {
      q,
      format: 'json',
      addressdetails: '1',
      limit: '8',
    }),
    signal
  )) as NominatimResult[];

  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      const fields = toFields(item);
      const lat = Number(item.lat);
      const lon = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return {
        id: String(item.place_id ?? `${lat},${lon}`),
        label: item.display_name || suggestionDetail(fields),
        detail: suggestionDetail(fields),
        lat,
        lon,
        fields,
      };
    })
    .filter(Boolean) as LocationSuggestion[];
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<{ fields: CheckoutAddressFields; label: string } | null> {
  const data = (await nominatimFetch(
    nominatimUrl('/reverse', {
      lat: String(lat),
      lon: String(lon),
      format: 'json',
      addressdetails: '1',
      zoom: '18',
    }),
    signal
  )) as NominatimResult;

  if (!data?.lat) return null;
  const fields = toFields(data);
  return { fields, label: data.display_name || suggestionDetail(fields) };
}

export function mapQueryForAddress(fields: CheckoutAddressFields) {
  const parts = [fields.address, fields.city, fields.state, fields.postalCode, fields.country]
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.join(', ');
}

export function mapFocusQuery(fields: CheckoutAddressFields) {
  if (fields.address.trim() && (fields.city.trim() || fields.state.trim() || fields.country.trim())) {
    return mapQueryForAddress(fields);
  }
  if (fields.city.trim() && fields.country.trim()) {
    return `${fields.city}, ${fields.state}, ${fields.country}`.replace(/,\s+,/g, ',').replace(/^,\s*|,\s*$/g, '');
  }
  if (fields.state.trim() && fields.country.trim()) {
    return `${fields.state}, ${fields.country}`;
  }
  if (fields.country.trim()) return fields.country.trim();
  if (fields.state.trim()) return fields.state.trim();
  if (fields.city.trim()) return fields.city.trim();
  return '';
}

export function zoomForQuery(fields: CheckoutAddressFields) {
  if (fields.address.trim()) return 16;
  if (fields.city.trim()) return 12;
  if (fields.state.trim()) return 7;
  if (fields.country.trim()) return 5;
  return 2;
}
