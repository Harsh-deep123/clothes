import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';

const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR =
  import.meta.env.VITE_MAP_TILE_ATTR || '&copy; OpenStreetMap contributors';

type DeliveryLocationView = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
};

const markerIcon = L.divIcon({
  className: 'zayro-admin-delivery-marker',
  html: '<span class="zayro-admin-delivery-marker-dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export const AdminDeliveryLocationModal: React.FC<{
  location: DeliveryLocationView;
  onClose: () => void;
}> = ({ location, onClose }) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { scrollWheelZoom: true }).setView(
      [location.latitude, location.longitude],
      16
    );
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
    L.marker([location.latitude, location.longitude], { icon: markerIcon }).addTo(map);
    mapRef.current = map;
    const resize = window.setTimeout(() => map.invalidateSize(), 80);
    return () => {
      window.clearTimeout(resize);
      map.remove();
      mapRef.current = null;
    };
  }, [location.latitude, location.longitude]);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${location.latitude},${location.longitude}`
  )}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 rounded-2xl z-10 max-h-[90vh] flex flex-col">
        <style>{`
          .zayro-admin-delivery-marker { background: transparent; border: 0; }
          .zayro-admin-delivery-marker-dot {
            display: block;
            width: 16px;
            height: 16px;
            margin: 3px;
            border-radius: 999px;
            background: #0f172a;
            border: 2px solid #ffffff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.35);
          }
          .zayro-admin-delivery-map .leaflet-container {
            height: 100%;
            width: 100%;
            z-index: 1;
            background: #eeeeee;
          }
        `}</style>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <p className="text-xs uppercase tracking-wider text-slate-400">View Delivery Location</p>
          <button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-2 text-sm border-b border-slate-100">
          <p>
            <span className="text-slate-400">Customer</span>
            <span className="block font-medium">{location.customerName}</span>
          </p>
          <p>
            <span className="text-slate-400">Customer phone</span>
            <span className="block font-medium">{location.customerPhone}</span>
          </p>
          <p>
            <span className="text-slate-400">Delivery address</span>
            <span className="block">{location.deliveryAddress}</span>
          </p>
        </div>
        <div className="zayro-admin-delivery-map w-full h-[42vh] min-h-[240px] bg-[#eeeeee]">
          <div ref={mapEl} className="w-full h-full" />
        </div>
        <div className="px-5 py-4">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-xs font-semibold uppercase px-3 py-1.5 rounded-lg bg-slate-900 text-white"
          >
            Get Directions
          </a>
        </div>
      </div>
    </div>
  );
};
