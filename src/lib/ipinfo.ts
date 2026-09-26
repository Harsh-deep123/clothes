export type IpinfoLite = {
  ip?: string;
  asn?: string;
  as_name?: string;
  as_domain?: string;
  country_code?: string;
  country?: string;
  continent_code?: string;
  continent?: string;
  region?: string;
  city?: string;
};

export async function fetchIpinfoLite(): Promise<IpinfoLite | null> {
  try {
    const response = await fetch('/api/ipinfo', { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const data = (await response.json()) as IpinfoLite & { error?: string };
    if (!data || data.error) return null;
    return data;
  } catch {
    return null;
  }
}

export function deliveryLocationFromIpinfo(info: IpinfoLite): {
  label: string;
  lat: number;
  lon: number;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  ip?: string;
} {
  return {
    label: info.city || info.country || 'Detected location',
    lat: 0,
    lon: 0,
    city: info.city,
    state: info.region,
    country: info.country,
    countryCode: info.country_code,
    ip: info.ip,
  };
}

export function mergeLocationWithIpinfo<T extends {
  ip?: string;
  countryCode?: string;
  city?: string;
  state?: string;
  country?: string;
  label?: string;
}>(location: T, info: IpinfoLite | null): T {
  if (!info) return location;
  return {
    ...location,
    ip: info.ip || location.ip,
    countryCode: info.country_code || location.countryCode,
    country: info.country || location.country,
    city: location.city || info.city,
    state: location.state || info.region,
  };
}
