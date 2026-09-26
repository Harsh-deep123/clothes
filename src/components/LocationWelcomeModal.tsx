import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { LocationSuggestion, reverseGeocode, searchLocations } from '../lib/geocode';
import { fetchIpinfoLite, mergeLocationWithIpinfo } from '../lib/ipinfo';

export const DELIVERY_LOCATION_KEY = 'zayro_delivery_location';

export interface SavedDeliveryLocation {
  label: string;
  lat: number;
  lon: number;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  ip?: string;
}

export function readSavedDeliveryLocation(): SavedDeliveryLocation | null {
  try {
    const raw = localStorage.getItem(DELIVERY_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDeliveryLocation;
    if (!parsed || typeof parsed.label !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function deliveryCityLabel(location: SavedDeliveryLocation | null): string | null {
  if (!location) return null;
  const city = location.city?.trim();
  if (city) return city;
  const fromLabel = location.label.split(',')[0]?.trim();
  if (fromLabel && fromLabel.toLowerCase() !== 'current location') return fromLabel;
  return null;
}

const inputClass =
  'w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';

interface LocationWelcomeModalProps {
  isOpen: boolean;
  onComplete: (location: SavedDeliveryLocation) => void;
}

export const LocationWelcomeModal: React.FC<LocationWelcomeModalProps> = ({ isOpen, onComplete }) => {
  const searchAbort = useRef<AbortController | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = window.setTimeout(async () => {
      searchAbort.current?.abort();
      const controller = new AbortController();
      searchAbort.current = controller;
      try {
        const results = await searchLocations(query, controller.signal);
        setSuggestions(results);
        setError(results.length === 0 ? 'No matching locations found.' : null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setSuggestions([]);
        setError('Location search is unavailable right now.');
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const finish = async (location: SavedDeliveryLocation) => {
    let next = location;
    try {
      const info = await fetchIpinfoLite();
      next = mergeLocationWithIpinfo(location, info);
    } catch {
      next = location;
    }
    try {
      localStorage.setItem(DELIVERY_LOCATION_KEY, JSON.stringify(next));
    } catch {
      /* ignore storage errors */
    }
    onComplete(next);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Current location is not supported in this browser.');
      return;
    }
    setDetecting(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const result = await reverseGeocode(lat, lon);
          finish({
            label: result?.label || 'Current location',
            lat,
            lon,
            city: result?.fields.city,
            state: result?.fields.state,
            country: result?.fields.country,
            countryCode: result?.fields.countryCode,
          });
        } catch {
          finish({ label: 'Current location', lat, lon });
        } finally {
          setDetecting(false);
        }
      },
      (geoError) => {
        setDetecting(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError('Location permission was denied. Search for a delivery location instead.');
          return;
        }
        setError('Could not detect your location. Please search instead.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const selectSuggestion = (item: LocationSuggestion) => {
    void finish({
      label: item.label,
      lat: item.lat,
      lon: item.lon,
      city: item.fields.city,
      state: item.fields.state,
      country: item.fields.country,
      countryCode: item.fields.countryCode,
    });
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white w-full max-w-md shadow-2xl border border-[#cfc4c5]/30 z-10 p-6 sm:p-10">
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] mb-3">
          Delivery
        </p>
        <h2 className="font-serif-luxury text-3xl sm:text-4xl text-black font-normal tracking-tight mb-4">
          Welcome to ZAYRO STORE
        </h2>
        <p className="text-sm text-[#5d5f5f] font-light leading-relaxed mb-8">
          Please provide your delivery location to see products available near you.
        </p>

        <button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          className="w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          {detecting ? 'Detecting Location…' : 'Detect my location'}
        </button>

        <div className="flex items-center gap-4 my-6">
          <span className="flex-1 h-px bg-[#cfc4c5]/40" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f]">OR</span>
          <span className="flex-1 h-px bg-[#cfc4c5]/40" />
        </div>

        <label className="text-xs uppercase tracking-[0.15em] font-semibold text-black mb-2 block">
          Search delivery location
        </label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5d5f5f]" />
          <input
            className={`${inputClass} pl-10`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="City, area, or pincode"
            autoComplete="off"
          />
        </div>
        {searching && <p className="text-xs text-[#5d5f5f] mt-2">Searching locations…</p>}
        {suggestions.length > 0 && (
          <ul className="border border-[#cfc4c5] bg-white mt-0 max-h-52 overflow-y-auto">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(item)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-[#eeeeee] cursor-pointer border-b border-[#cfc4c5]/30 last:border-b-0"
                >
                  <span className="block text-black">{item.label}</span>
                  {item.detail && (
                    <span className="block text-xs text-[#5d5f5f] mt-1">{item.detail}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="text-sm text-[#ba1a1a] mt-3">{error}</p>}
      </div>
    </div>
  );
};
