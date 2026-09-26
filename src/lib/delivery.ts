import { DELIVERY_CONFIG, DeliveryZoneRule } from '../data/deliveryZones';
import type { IpinfoLite } from './ipinfo';

export type DeliverySignals = {
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  label?: string;
};

export type DeliveryQuote = {
  available: boolean;
  zoneId: string | null;
  zoneLabel: string | null;
  deliveryCharge: number;
  handlingCharge: number;
  message: string | null;
};

function norm(value?: string | null): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function matchesAny(value: string, candidates?: string[]): boolean {
  if (!value || !candidates?.length) return false;
  return candidates.some((candidate) => {
    const needle = norm(candidate);
    return value === needle || value.includes(needle) || needle.includes(value);
  });
}

function sameCountry(saved?: DeliverySignals | null, ipinfo?: IpinfoLite | null): boolean {
  if (!ipinfo?.country_code && !ipinfo?.country) return true;
  const ipCode = norm(ipinfo.country_code);
  const ipName = norm(ipinfo.country);
  const savedCode = norm(saved?.countryCode);
  const savedName = norm(saved?.country);
  if (ipCode && savedCode) return ipCode === savedCode;
  if (ipName && savedName) return ipName === savedName;
  return !savedCode && !savedName;
}

export function mergeDeliverySignals(
  saved?: DeliverySignals | null,
  ipinfo?: IpinfoLite | null
): DeliverySignals {
  const gpsMatchesIp = sameCountry(saved, ipinfo);
  return {
    city: gpsMatchesIp ? saved?.city || ipinfo?.city : ipinfo?.city,
    state: gpsMatchesIp ? saved?.state || saved?.region || ipinfo?.region : ipinfo?.region,
    country: ipinfo?.country || saved?.country,
    countryCode: ipinfo?.country_code || saved?.countryCode,
    region: gpsMatchesIp ? saved?.region || ipinfo?.region : ipinfo?.region,
    label: gpsMatchesIp ? saved?.label : ipinfo?.country,
  };
}

function zoneMatches(zone: DeliveryZoneRule, signals: DeliverySignals): boolean {
  const city = norm(signals.city) || norm(signals.label?.split(',')[0]);
  const state = norm(signals.state) || norm(signals.region);
  const country = norm(signals.country);
  const code = norm(signals.countryCode);

  if (zone.cities?.length) {
    return matchesAny(city, zone.cities);
  }
  if (zone.states?.length) {
    return matchesAny(state, zone.states);
  }
  if (zone.countryCodes?.length || zone.countryNames?.length) {
    return matchesAny(code, zone.countryCodes) || matchesAny(country, zone.countryNames);
  }
  return false;
}

export function getDeliveryQuote(
  saved?: DeliverySignals | null,
  ipinfo?: IpinfoLite | null
): DeliveryQuote {
  const signals = mergeDeliverySignals(saved, ipinfo);
  const hasSignals = Boolean(
    norm(signals.city) ||
      norm(signals.state) ||
      norm(signals.country) ||
      norm(signals.countryCode) ||
      norm(signals.label)
  );

  if (!hasSignals) {
    return {
      available: false,
      zoneId: null,
      zoneLabel: null,
      deliveryCharge: 0,
      handlingCharge: 0,
      message: DELIVERY_CONFIG.unavailableMessage,
    };
  }

  const zone = DELIVERY_CONFIG.zones.find((item) => zoneMatches(item, signals));
  if (!zone) {
    return {
      available: false,
      zoneId: null,
      zoneLabel: null,
      deliveryCharge: 0,
      handlingCharge: 0,
      message: DELIVERY_CONFIG.unavailableMessage,
    };
  }

  return {
    available: true,
    zoneId: zone.id,
    zoneLabel: zone.label,
    deliveryCharge: zone.charge,
    handlingCharge: zone.handlingCharge,
    message: null,
  };
}

export function cartGrandTotal(itemsTotal: number, quote: DeliveryQuote, discount = 0): number {
  const delivery = quote.available ? quote.deliveryCharge : 0;
  const handling = quote.available ? quote.handlingCharge : 0;
  return itemsTotal + delivery + handling - discount;
}
