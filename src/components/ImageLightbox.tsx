import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  startIndex?: number;
  alt?: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  startIndex = 0,
  alt = 'Product image',
  onClose,
}) => {
  const valid = images.filter(Boolean);
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), Math.max(valid.length - 1, 0)));
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') setIndex((i) => (i - 1 + valid.length) % valid.length);
      if (event.key === 'ArrowRight') setIndex((i) => (i + 1) % valid.length);
      if (event.key === '+' || event.key === '=') setZoom((z) => Math.min(3, Number((z + 0.5).toFixed(1))));
      if (event.key === '-') setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))));
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, valid.length]);

  useEffect(() => {
    setZoom(1);
  }, [index]);

  if (!valid.length) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90" role="dialog" aria-modal="true" aria-label="Image preview">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="text-xs uppercase tracking-[0.15em] font-medium">
          {index + 1} / {valid.length}
          <span className="ml-3 opacity-70">Zoom {zoom.toFixed(1)}x</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))))}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(3, Number((z + 0.5).toFixed(1))))}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 pb-4">
        {valid.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => setIndex((i) => (i - 1 + valid.length) % valid.length)}
              className="absolute left-3 md:left-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setIndex((i) => (i + 1) % valid.length)}
              className="absolute right-3 md:right-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        <div className="w-full h-full overflow-auto flex items-center justify-center">
          <img
            src={valid[index]}
            alt={`${alt} ${index + 1}`}
            onDoubleClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
            className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          />
        </div>
      </div>

      {valid.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-4 justify-center">
          {valid.map((src, i) => (
            <button
              key={`${i}-${src.slice(-24)}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`shrink-0 w-14 h-16 rounded overflow-hidden border-2 cursor-pointer ${
                i === index ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  onOpen: () => void;
  showHint?: boolean;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  src,
  alt,
  className = '',
  imageClassName = 'w-full h-full object-cover object-center',
  onOpen,
  showHint = true,
}) => (
  <button
    type="button"
    onClick={onOpen}
    className={`group relative block w-full h-full overflow-hidden cursor-zoom-in text-left ${className}`}
    aria-label={`Zoom ${alt}`}
  >
    <img src={src} alt={alt} className={`${imageClassName} transition-transform duration-300 group-hover:scale-[1.03]`} />
    {showHint && (
      <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-black/70 text-white text-[10px] uppercase tracking-[0.15em] px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ZoomIn className="w-3.5 h-3.5" />
        Zoom
      </span>
    )}
  </button>
);

interface HoverZoomImageProps {
  src: string;
  alt: string;
  scale?: number;
}

/** In-place hover/tap zoom — no fullscreen popup. */
export const HoverZoomImage: React.FC<HoverZoomImageProps> = ({ src, alt, scale = 2.25 }) => {
  const [origin, setOrigin] = useState('50% 50%');
  const [active, setActive] = useState(false);

  const updateOrigin = (clientX: number, clientY: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    setOrigin(`${x}% ${y}%`);
  };

  return (
    <div
      className="group relative h-full w-full overflow-hidden cursor-zoom-in touch-none select-none"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={(e) => updateOrigin(e.clientX, e.clientY, e.currentTarget)}
      onClick={() => setActive((v) => !v)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (!t) return;
        setActive(true);
        updateOrigin(t.clientX, t.clientY, e.currentTarget);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (!t) return;
        updateOrigin(t.clientX, t.clientY, e.currentTarget);
      }}
      onTouchEnd={() => setActive(false)}
      role="img"
      aria-label={`${alt} — hover or tap to zoom`}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-cover object-center will-change-transform transition-transform duration-100 ease-out"
        style={{
          transform: active ? `scale(${scale})` : 'scale(1)',
          transformOrigin: origin,
        }}
      />
      <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 bg-black/65 text-white text-[10px] uppercase tracking-[0.12em] px-2 py-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <ZoomIn className="w-3 h-3" />
        Zoom
      </span>
    </div>
  );
};

interface AmazonLensZoomProps {
  images: string[];
  alt: string;
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Amazon-style: thumbnails + main image lens + large zoom pane on the right. */
export const AmazonLensZoom: React.FC<AmazonLensZoomProps> = ({
  images,
  alt,
  activeIndex,
  onSelect,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [zooming, setZooming] = useState(false);
  const [lens, setLens] = useState({ x: 0, y: 0, w: 0, h: 0, stageW: 0, stageH: 0 });
  const src = images[Math.min(activeIndex, Math.max(images.length - 1, 0))] || images[0];
  const LENS_RATIO = 0.42;

  const moveLens = (clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const stageW = rect.width;
    const stageH = rect.height;
    if (!stageW || !stageH) return;
    const w = stageW * LENS_RATIO;
    const h = stageH * LENS_RATIO;
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const x = Math.min(Math.max(mx - w / 2, 0), stageW - w);
    const y = Math.min(Math.max(my - h / 2, 0), stageH - h);
    setLens({ x, y, w, h, stageW, stageH });
    setZooming(true);
  };

  if (!src) return null;

  const zoomScale = lens.w ? lens.stageW / lens.w : 2.4;

  return (
    <div className="relative w-full max-w-[440px] mx-auto md:mx-0">
      <div className="flex gap-2 md:gap-3 items-start">
        {images.length > 0 && (
          <div className="hidden md:flex flex-col gap-2 shrink-0 max-h-[560px] overflow-y-auto pr-0.5">
            {images.map((thumb, index) => (
              <button
                key={`${index}-${thumb.slice(-20)}`}
                type="button"
                onClick={() => onSelect(index)}
                onMouseEnter={() => onSelect(index)}
                aria-label={`Thumbnail ${index + 1}`}
                aria-current={index === activeIndex}
                className={`h-[72px] w-[54px] shrink-0 overflow-hidden border bg-[#eeeeee] cursor-pointer ${
                  index === activeIndex ? 'border-black ring-1 ring-black' : 'border-[#cfc4c5]/50 hover:border-black'
                }`}
              >
                <img src={thumb} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1 min-w-0">
          <div
            ref={stageRef}
            className="relative w-full aspect-[3/4] max-h-[560px] bg-[#eeeeee] overflow-hidden border border-[#cfc4c5]/20 cursor-crosshair"
            onMouseEnter={(e) => moveLens(e.clientX, e.clientY)}
            onMouseMove={(e) => moveLens(e.clientX, e.clientY)}
            onMouseLeave={() => setZooming(false)}
          >
            <img src={src} alt={alt} draggable={false} className="h-full w-full object-contain object-center select-none" />
            {zooming && (
              <div
                className="pointer-events-none absolute border border-[#2563eb]/80 bg-[#3b82f6]/25"
                style={{
                  left: lens.x,
                  top: lens.y,
                  width: lens.w,
                  height: lens.h,
                  backgroundImage:
                    'linear-gradient(to right, rgba(37,99,235,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.15) 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
              />
            )}
          </div>
          <p className="mt-1.5 text-xs text-[#5d5f5f] hidden md:block">Hover image to zoom</p>

          {images.length > 0 && (
            <div className="mt-2 flex md:hidden flex-wrap gap-2">
              {images.map((thumb, index) => (
                <button
                  key={`m-${index}-${thumb.slice(-20)}`}
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-label={`Thumbnail ${index + 1}`}
                  className={`h-16 w-14 shrink-0 overflow-hidden border bg-[#eeeeee] cursor-pointer ${
                    index === activeIndex ? 'border-black ring-1 ring-black' : 'border-[#cfc4c5]/50'
                  }`}
                >
                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {zooming && (
        <div
          className="pointer-events-none absolute left-full top-0 z-40 ml-3 hidden md:block overflow-hidden border border-[#cfc4c5]/40 bg-white shadow-2xl"
          style={{
            width: Math.max(lens.stageW, 320),
            height: Math.max(lens.stageH, 320),
          }}
          aria-hidden
        >
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute max-w-none object-cover"
            style={{
              width: lens.stageW * zoomScale,
              height: lens.stageH * zoomScale,
              left: -lens.x * zoomScale,
              top: -lens.y * zoomScale,
            }}
          />
        </div>
      )}
    </div>
  );
};
