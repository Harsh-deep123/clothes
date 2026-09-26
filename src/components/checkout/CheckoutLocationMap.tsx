import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';
import {
  CheckoutAddressFields,
  LocationSuggestion,
  reverseGeocode,
  searchLocations,
} from '../../lib/geocode';

const inputClass =
  'w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';
const labelClass = 'text-xs uppercase tracking-[0.15em] font-semibold text-black mb-2 block';

const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR =
  import.meta.env.VITE_MAP_TILE_ATTR || '&copy; OpenStreetMap contributors';

interface CheckoutLocationMapProps {
  onAddressChange: (next: Partial<CheckoutAddressFields>) => void;
  onCoordinatesChange?: (lat: number, lon: number) => void;
}

const markerIcon = L.divIcon({
  className: 'zayro-checkout-marker',
  html: '<span class="zayro-checkout-marker-dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export const CheckoutLocationMap: React.FC<CheckoutLocationMapProps> = ({
  onAddressChange,
  onCoordinatesChange,
}) => {
  const searchAbort = useRef<AbortController | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [origin, setOrigin] = useState<{ lat: number; lon: number } | null>(null);

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
        setMessage(results.length === 0 ? 'No matching locations found. Try a more specific search.' : null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setSuggestions([]);
        setMessage('Location search is unavailable right now. You can still type the address.');
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  const selectSuggestion = (item: LocationSuggestion) => {
    setQuery(item.label);
    setSuggestions([]);
    setMessage(null);
    onAddressChange(item.fields);
    onCoordinatesChange?.(item.lat, item.lon);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Current location is not supported in this browser.');
      return;
    }
    setLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setOrigin({ lat: position.coords.latitude, lon: position.coords.longitude });
        setMapOpen(true);
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setMessage('Location permission was denied. Enable it in your browser, or search for a location.');
          return;
        }
        if (error.code === error.TIMEOUT) {
          setMessage('Could not detect your current location in time. Please try again or search for a location.');
          return;
        }
        setMessage('Could not detect your current location. Please search for a location instead.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      <style>{`
        .zayro-checkout-marker { background: transparent; border: 0; }
        .zayro-checkout-marker-dot {
          display: block;
          width: 16px;
          height: 16px;
          margin: 3px;
          border-radius: 999px;
          background: #1a1c1c;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.35);
        }
        .zayro-checkout-map-modal .leaflet-container {
          font-family: inherit;
          height: 100%;
          width: 100%;
          z-index: 1;
          background: #eeeeee;
        }
      `}</style>

      <div>
        <label className={labelClass}>Search Location</label>
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a street, city, or place"
          autoComplete="off"
        />
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
      </div>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className="w-full border border-black text-black text-xs font-semibold uppercase py-3 tracking-[0.2em] hover:bg-[#eeeeee] cursor-pointer disabled:opacity-50"
      >
        {locating ? 'Detecting Location…' : 'Use Current Location'}
      </button>

      {message && <p className="text-sm text-[#ba1a1a]">{message}</p>}

      {mapOpen && origin && (
        <LocationMapModal
          lat={origin.lat}
          lon={origin.lon}
          onClose={() => setMapOpen(false)}
          onConfirm={(fields, pinLat, pinLon) => {
            onAddressChange(fields);
            onCoordinatesChange?.(pinLat, pinLon);
            setMapOpen(false);
            setMessage(null);
          }}
        />
      )}
    </div>
  );
};

interface LocationMapModalProps {
  lat: number;
  lon: number;
  onClose: () => void;
  onConfirm: (fields: CheckoutAddressFields, lat: number, lon: number) => void;
}

const LocationMapModal: React.FC<LocationMapModalProps> = ({ lat, lon, onClose, onConfirm }) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const reverseAbort = useRef<AbortController | null>(null);
  const [preview, setPreview] = useState<CheckoutAddressFields | null>(null);
  const [previewLabel, setPreviewLabel] = useState('Reading address…');
  const [modalError, setModalError] = useState<string | null>(null);

  const lookup = async (nextLat: number, nextLon: number, map: L.Map) => {
    reverseAbort.current?.abort();
    const controller = new AbortController();
    reverseAbort.current = controller;
    const point = L.latLng(nextLat, nextLon);
    if (markerRef.current) markerRef.current.setLatLng(point);
    map.setView(point, Math.max(map.getZoom(), 16));
    try {
      const result = await reverseGeocode(nextLat, nextLon, controller.signal);
      if (!result) {
        setPreview(null);
        setPreviewLabel('Could not read an address for that point.');
        setModalError('Move the marker or tap another point, then try again.');
        return;
      }
      setPreview(result.fields);
      setPreviewLabel(result.label);
      setModalError(null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setPreview(null);
      setPreviewLabel('Could not look up that location.');
      setModalError('Please try another point on the map.');
    }
  };

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    const map = L.map(mapEl.current, {
      scrollWheelZoom: true,
      attributionControl: true,
    }).setView([lat, lon], 16);

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
    const marker = L.marker([lat, lon], { icon: markerIcon, draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      void lookup(pos.lat, pos.lng, map);
    });
    map.on('click', (event: L.LeafletMouseEvent) => {
      void lookup(event.latlng.lat, event.latlng.lng, map);
    });
    mapRef.current = map;
    markerRef.current = marker;
    void lookup(lat, lon, map);
    const resize = window.setTimeout(() => map.invalidateSize(), 80);

    return () => {
      window.clearTimeout(resize);
      reverseAbort.current?.abort();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl overflow-hidden shadow-2xl border border-[#cfc4c5]/30 z-10 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#cfc4c5]/30">
          <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-black">Current Location</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-black hover:bg-[#eeeeee] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="zayro-checkout-map-modal w-full h-[42vh] min-h-[240px] sm:h-[360px] bg-[#eeeeee] border-b border-[#cfc4c5]/30">
          <div ref={mapEl} className="w-full h-full" />
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-black">{previewLabel}</p>
          {preview && (
            <p className="text-xs text-[#5d5f5f]">
              {[preview.address, preview.city, preview.state, preview.postalCode, preview.country]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {modalError && <p className="text-sm text-[#ba1a1a]">{modalError}</p>}
          <button
            type="button"
            disabled={!preview}
            onClick={() => {
              if (!preview) return;
              const pos = markerRef.current?.getLatLng();
              onConfirm(preview, pos?.lat ?? lat, pos?.lng ?? lon);
            }}
            className="w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};
