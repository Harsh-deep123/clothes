import React, { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X } from 'lucide-react';
import { storeProductImage } from '../lib/productMedia';

type AspectOption = { label: string; value: number | undefined };

const ASPECTS: AspectOption[] = [
  { label: '3:4 product', value: 3 / 4 },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: 'Free', value: undefined },
];

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', () => reject(new Error('Could not load image for crop.')));
    img.src = src;
  });
}

async function blobUrl(src: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error('Could not load image for crop.');
  return URL.createObjectURL(await response.blob());
}

async function cropToDataUrl(
  imageSrc: string,
  pixelCrop: Area,
  mime = 'image/jpeg',
  quality = 0.92
): Promise<string> {
  let objectUrl = '';
  let image: HTMLImageElement;
  if (imageSrc.startsWith('data:')) {
    image = await loadImageElement(imageSrc);
  } else {
    const remote = /^https?:\/\//i.test(imageSrc);
    try {
      objectUrl = await blobUrl(imageSrc);
    } catch {
      if (!remote) throw new Error('Could not load image for crop.');
      const stored = await storeProductImage(imageSrc);
      objectUrl = await blobUrl(stored);
    }
    try {
      image = await loadImageElement(objectUrl);
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    }
  }

  const canvas = document.createElement('canvas');
  const w = Math.max(1, Math.round(pixelCrop.width));
  const h = Math.max(1, Math.round(pixelCrop.height));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not crop image.');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    w,
    h
  );

  try {
    if (imageSrc.startsWith('data:image/png')) {
      return canvas.toDataURL('image/png');
    }
    return canvas.toDataURL(mime, quality);
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export interface ImageCropModalProps {
  imageSrc: string;
  title?: string;
  onCancel: () => void;
  onCropped: (dataUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  title = 'Crop image',
  onCancel,
  onCropped,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(3 / 4);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const apply = async () => {
    if (!croppedAreaPixels) {
      setError('Adjust the crop area first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await cropToDataUrl(imageSrc, croppedAreaPixels);
      onCropped(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
            <p className="text-xs text-slate-400 mt-1">Drag to reposition · scroll or slider to zoom</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Close crop tool"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative h-[360px] sm:h-[420px] bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {ASPECTS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setAspect(option.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                  aspect === option.value
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-xs text-slate-500">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-1.5 w-full accent-slate-900"
            />
          </label>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm cursor-pointer"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void apply()}
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              {busy ? 'Cropping…' : 'Apply crop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
