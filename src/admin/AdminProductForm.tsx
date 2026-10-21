import React, { useEffect, useMemo, useState } from 'react';
import { Crop, Eye, Star, Trash2, Upload } from 'lucide-react';
import {
  AdminProduct,
  calculateSalePrice,
  discountPercentOff,
  getCatalogProduct,
  RETURN_POLICY_OPTIONS,
  newDesignId,
  slugify,
  upsertProduct,
} from '../catalog';
import type { ProductDesign, ReturnPolicy } from '../types';
import { useAdminCategories } from '../hooks/useCatalog';
import { formatINR } from '../lib/money';
import { ImageLightbox } from '../components/ImageLightbox';
import { AmazonSalePrice } from '../components/ProductPrice';
import { ImageCropModal } from './ImageCropModal';
import { saveProductRecord, storeProductImage, storeProductImages } from '../lib/productMedia';

type CropSession =
  | { mode: 'replace'; index: number; src: string }
  | { mode: 'queue'; current: string; rest: string[] }
  | { mode: 'design'; index: number; src: string };

interface AdminProductFormProps {
  productId?: string | null;
  onCancel: () => void;
  onSaved: () => void;
  notify: (message: string, type: 'success' | 'error') => void;
}

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const CLOTHING_SIZE_PRESETS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'] as const;

const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#9CA3AF' },
  { name: 'Charcoal', hex: '#374151' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Sky Blue', hex: '#7DD3FC' },
  { name: 'Teal', hex: '#0F766E' },
  { name: 'Green', hex: '#15803D' },
  { name: 'Olive', hex: '#6B7234' },
  { name: 'Mint', hex: '#A7F3D0' },
  { name: 'Yellow', hex: '#FACC15' },
  { name: 'Mustard', hex: '#CA8A04' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Maroon', hex: '#7F1D1D' },
  { name: 'Pink', hex: '#F472B6' },
  { name: 'Peach', hex: '#FBBF9A' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Lavender', hex: '#C4B5FD' },
  { name: 'Brown', hex: '#78350F' },
  { name: 'Beige', hex: '#E7D8C0' },
  { name: 'Cream', hex: '#FFF8E7' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Silver', hex: '#C0C0C0' },
];

const emptyProduct = (): AdminProduct => ({
  id: '',
  name: '',
  subtitle: '',
  price: 0,
  listPrice: 0,
  category: 't-shirts',
  categoryLabel: 'T-Shirts',
  breadcrumb: 'Men / T-Shirts',
  images: [''],
  colors: [{ name: 'Black', hex: '#000000' }],
  sizes: [
    { size: 'XS', available: true },
    { size: 'S', available: true },
    { size: 'M', available: true },
    { size: 'L', available: true },
    { size: 'XL', available: true },
    { size: 'XXL', available: true },
    { size: 'XXXL', available: true },
  ],
  description: '',
  detailsAndCare: [''],
  shippingAndReturns: 'Complimentary express shipping on all orders. Returns accepted within 14 days of delivery in original condition.',
  isNew: true,
  material: '',
  stock: 10,
  active: true,
  discountEnabled: false,
  discountType: 'percent',
  discountValue: 0,
  saleEnabled: false,
  saleStart: '',
  saleEnd: '',
  returnPolicy: 'return_and_replace',
  hasSizes: true,
  hasColors: true,
  purchasedFrom: '',
  designs: [],
});

function readFiles(files: FileList): Promise<string[]> {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Could not read image'));
          reader.readAsDataURL(file);
        })
    )
  );
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  productId,
  onCancel,
  onSaved,
  notify,
}) => {
  const categories = useAdminCategories();
  const existing = productId ? getCatalogProduct(productId) : undefined;
  const [form, setForm] = useState<AdminProduct>(existing ? { ...existing } : emptyProduct());
  const [errors, setErrors] = useState<string[]>([]);

  const salePrice = useMemo(() => calculateSalePrice(form), [form]);

  // Recover photo URLs that were pasted into the design name field by mistake.
  useEffect(() => {
    setForm((prev) => {
      let changed = false;
      const designs = (prev.designs || []).map((design) => {
        const name = design.name.trim();
        if (!design.image.trim() && /^https?:\/\//i.test(name)) {
          changed = true;
          return { ...design, image: name, name: '' };
        }
        return design;
      });
      return changed ? { ...prev, designs } : prev;
    });
  }, []);

  const update = (patch: Partial<AdminProduct>) => setForm((prev) => ({ ...prev, ...patch }));
  const [openColorPicker, setOpenColorPicker] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [cropSession, setCropSession] = useState<CropSession | null>(null);
  const previewImages = form.images.filter(Boolean);

  const appendCroppedImage = (dataUrl: string) => {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images.filter(Boolean), dataUrl],
    }));
  };

  const finishCropQueue = (cropped: string, rest: string[]) => {
    appendCroppedImage(cropped);
    if (rest.length) {
      setCropSession({ mode: 'queue', current: rest[0], rest: rest.slice(1) });
      return;
    }
    setCropSession(null);
    notify('Image crop saved.', 'success');
  };

  const setColorAt = (index: number, hex: string, presetName?: string) => {
    setForm((prev) => {
      const colors = [...prev.colors];
      const current = colors[index];
      const currentName = current.name.trim();
      const nameIsAuto = !currentName || COLOR_PRESETS.some((p) => p.name === currentName);
      colors[index] = {
        ...current,
        hex,
        name: presetName && nameIsAuto ? presetName : current.name,
      };
      return { ...prev, colors };
    });
  };

  const applyCategory = (slug: string) => {
    const cat = categories.find((c) => c.slug === slug);
    update({
      category: slug,
      categoryLabel: cat?.name || slug,
      breadcrumb:
        slug === 'jewellery'
          ? 'Jewellery & Accessories'
          : slug === 'kitchen'
            ? 'Kitchen'
            : `Men / ${cat?.name || slug}`,
    });
  };

  const save = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    const nextErrors: string[] = [];
    if (!form.name.trim()) nextErrors.push('Product name is required.');
    if (!form.description.trim()) nextErrors.push('Description is required.');
    if (!(form.listPrice > 0)) nextErrors.push('Original price must be greater than 0.');
    if (form.stock < 0) nextErrors.push('Stock cannot be negative.');
    const mainImages = form.images.filter(Boolean);
    const images = mainImages.length
      ? mainImages
      : form.colors.find((c) => c.images?.some(Boolean))?.images?.filter(Boolean) || [];
    if (!images.length) nextErrors.push('Add at least one product image.');
    const showColors = form.hasColors !== false;
    const colors = form.colors.filter((c) => c.name.trim());
    if (showColors && !colors.length) nextErrors.push('Add at least one color option.');
    const showSizes = form.hasSizes !== false;
    const sizes = form.sizes.filter((s) => s.size.trim());
    if (showSizes && !sizes.length) nextErrors.push('Add at least one size.');
    if (showSizes && new Set(sizes.map((s) => s.size.trim())).size !== sizes.length) {
      nextErrors.push('Each size must be unique.');
    }
    if (form.discountEnabled && (!form.discountValue || form.discountValue <= 0)) {
      nextErrors.push('Enter a discount value, or disable the discount.');
    }
    if (form.discountType === 'percent' && form.discountValue > 100) {
      nextErrors.push('Percentage discount cannot exceed 100.');
    }
    if (form.saleStart && form.saleEnd && form.saleEnd < form.saleStart) {
      nextErrors.push('Sale end date must be after the start date.');
    }
    const usedDesignIds = new Set<string>();
    const designs: ProductDesign[] = (form.designs || [])
      .map((design) => {
        const name = design.name.trim();
        const image = design.image.trim();
        const color = design.color?.trim() || '';
        let id = design.id.trim();
        if (!id || usedDesignIds.has(id)) id = newDesignId([...usedDesignIds]);
        usedDesignIds.add(id);
        return { id, name, image, color };
      })
      .filter((design) => design.name || design.image);
    if (designs.some((design) => !design.name || !design.image)) {
      nextErrors.push('Each design needs a name and a photo.');
    }
    if (new Set(designs.map((design) => design.name.toLowerCase())).size !== designs.length) {
      nextErrors.push('Each design name must be unique.');
    }
    if (nextErrors.length) {
      setErrors(nextErrors);
      notify(nextErrors[0], 'error');
      return;
    }

    const id = existing?.id || slugify(form.name);
    const payload: AdminProduct = {
      ...form,
      id,
      images,
      colors: colors.length
        ? colors.map((c) => ({
            name: c.name.trim(),
            hex: c.hex || '#000000',
            border: c.border,
            images: c.images?.filter(Boolean).length ? c.images.filter(Boolean) : undefined,
          }))
        : form.colors,
      sizes: sizes.length ? sizes.map((s) => ({ ...s, size: s.size.trim() })) : form.sizes,
      hasSizes: showSizes,
      hasColors: showColors,
      designs,
      purchasedFrom: form.purchasedFrom?.trim() || '',
      detailsAndCare: form.detailsAndCare.filter(Boolean),
      discountEnabled: form.saleEnabled ? true : form.discountEnabled,
      price: form.saleEnabled && form.discountValue ? salePrice : form.listPrice,
      isSale: Boolean(form.saleEnabled && form.discountValue),
    };
    let stored = payload;
    try {
      stored = await storeProductImages(payload);
      setForm(stored);
      upsertProduct(stored);
      await saveProductRecord(stored);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save product.', 'error');
      return;
    }
    notify(existing ? 'Product updated.' : 'Product created.', 'success');
    onSaved();
  };

  const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white';

  return (
    <form onSubmit={save} noValidate className="max-w-5xl space-y-6">
      {errors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl px-4 py-3">
          {errors.map((err) => (
            <p key={err}>{err}</p>
          ))}
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-2xl p-5 grid md:grid-cols-2 gap-4">
        <h3 className="md:col-span-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Product details</h3>
        <label className="block md:col-span-2">
          <span className="text-sm">Name</span>
          <input value={form.name} onChange={(e) => update({ name: e.target.value })} className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-sm">Subtitle</span>
          <input value={form.subtitle || ''} onChange={(e) => update({ subtitle: e.target.value })} className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-sm">Material</span>
          <input value={form.material || ''} onChange={(e) => update({ material: e.target.value })} className={fieldClass} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm">Purchased from (admin only)</span>
          <input
            value={form.purchasedFrom || ''}
            onChange={(e) => update({ purchasedFrom: e.target.value })}
            placeholder="e.g. Amazon, Flipkart, Alibaba…"
            className={fieldClass}
          />
          <span className="mt-1 block text-xs text-slate-400">Only visible in admin — never shown to customers.</span>
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm">Description</span>
          <textarea value={form.description} onChange={(e) => update({ description: e.target.value })} rows={4} className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-sm">Category</span>
          <select value={form.category} onChange={(e) => applyCategory(e.target.value)} className={fieldClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 mt-6">
          <input type="checkbox" checked={form.isNew || false} onChange={(e) => update({ isNew: e.target.checked })} />
          <span className="text-sm">Mark as new arrival</span>
        </label>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Product images</h3>
            <p className="text-xs text-slate-400 mt-1">
              Main product photos only (listing + product page). These are separate from design photos below.
              The first image is the storefront thumbnail. After upload you can crop each photo (default 3:4).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
              onClick={() => update({ images: [...form.images, ''] })}
            >
              Add image URL
            </button>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm cursor-pointer hover:bg-slate-800">
              <Upload className="w-4 h-4" />
              Upload & crop
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const input = e.currentTarget;
                  if (!input.files?.length) return;
                  try {
                    const urls = await readFiles(input.files);
                    if (!urls.length) return;
                    setCropSession({ mode: 'queue', current: urls[0], rest: urls.slice(1) });
                  } catch (err) {
                    notify(err instanceof Error ? err.message : 'Could not upload one or more images.', 'error');
                  } finally {
                    input.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>

        {previewImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.images.map((src, index) => {
              if (!src) return null;
              const previewIdx = form.images.slice(0, index + 1).filter(Boolean).length - 1;
              return (
                <div
                  key={`${index}-${src.slice(-32)}`}
                  className="group relative h-24 w-20 shrink-0 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(previewIdx)}
                    className="block h-full w-full cursor-zoom-in"
                    aria-label={`Preview image ${previewIdx + 1}`}
                  >
                    <img src={src} alt={`Product ${previewIdx + 1}`} className="h-full w-full object-cover" />
                  </button>
                  {previewIdx === 0 && (
                    <span className="absolute top-1 left-1 rounded bg-black/85 text-white text-[9px] uppercase tracking-wider px-1 py-0.5">
                      Main
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={previewIdx === 0}
                      onClick={() => {
                        const images = [...form.images];
                        const [item] = images.splice(index, 1);
                        images.unshift(item);
                        update({ images });
                      }}
                      className="flex-1 flex items-center justify-center bg-black/70 text-white py-1 disabled:opacity-40 cursor-pointer"
                      title="Set as main"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCropSession({ mode: 'replace', index, src })}
                      className="flex-1 flex items-center justify-center bg-black/70 text-white py-1 cursor-pointer"
                      title="Crop image"
                    >
                      <Crop className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(previewIdx)}
                      className="flex-1 flex items-center justify-center bg-black/70 text-white py-1 cursor-pointer"
                      title="Zoom preview"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        update({ images: form.images.filter((_, i) => i !== index) });
                        setPreviewIndex(null);
                      }}
                      className="flex-1 flex items-center justify-center bg-black/70 text-red-300 py-1 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-slate-500">Image URLs</p>
          {form.images.map((url, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={url}
                onChange={(e) => {
                  const images = [...form.images];
                  images[index] = e.target.value;
                  update({ images });
                }}
                onBlur={async (e) => {
                  const value = e.target.value.trim();
                  if (!value || value === url) return;
                  try {
                    const stored = await storeProductImage(value);
                    setForm((prev) => {
                      const images = [...prev.images];
                      if (images[index]?.trim() !== value && images[index] !== stored) return prev;
                      images[index] = stored;
                      return { ...prev, images };
                    });
                  } catch (err) {
                    notify(err instanceof Error ? err.message : 'Could not save the image.', 'error');
                  }
                }}
                placeholder="https://… or upload above"
                className={fieldClass + ' mt-0'}
              />
              <button
                type="button"
                className="px-3 rounded-xl border border-slate-200 text-sm"
                onClick={() => update({ images: form.images.filter((_, i) => i !== index) })}
              >
                Remove
              </button>
            </div>
          ))}
          {!form.images.length && (
            <p className="text-xs text-slate-400">No images yet. Upload files or paste an image URL.</p>
          )}
        </div>

        {previewIndex !== null && previewImages.length > 0 && (
          <ImageLightbox
            images={previewImages}
            startIndex={previewIndex}
            alt={form.name || 'Product image'}
            onClose={() => setPreviewIndex(null)}
          />
        )}

        {cropSession && (
          <ImageCropModal
            imageSrc={cropSession.mode === 'queue' ? cropSession.current : cropSession.src}
            title={
              cropSession.mode === 'queue' && cropSession.rest.length
                ? `Crop image (${cropSession.rest.length + 1} left)`
                : 'Crop image'
            }
            onCancel={() => {
              if (cropSession.mode === 'queue' && cropSession.rest.length) {
                setCropSession({
                  mode: 'queue',
                  current: cropSession.rest[0],
                  rest: cropSession.rest.slice(1),
                });
                return;
              }
              setCropSession(null);
            }}
            onCropped={async (dataUrl) => {
              let stored = dataUrl;
              try {
                stored = await storeProductImage(dataUrl);
              } catch (err) {
                notify(err instanceof Error ? err.message : 'Could not save the cropped image.', 'error');
                return;
              }
              if (cropSession.mode === 'design') {
                const designIndex = cropSession.index;
                setForm((prev) => {
                  const designs = [...(prev.designs || [])];
                  if (!designs[designIndex]) return prev;
                  designs[designIndex] = { ...designs[designIndex], image: stored };
                  return { ...prev, designs };
                });
                setCropSession(null);
                notify('Design photo saved.', 'success');
                return;
              }
              if (cropSession.mode === 'replace') {
                const images = [...form.images];
                images[cropSession.index] = stored;
                update({ images });
                setCropSession(null);
                notify('Image saved.', 'success');
                return;
              }
              finishCropQueue(stored, cropSession.rest);
            }}
          />
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Designs</h3>
            <p className="text-xs text-slate-400 mt-1">
              Same kurti, different looks — each design needs its own photo (not the product images above).
              Every design gets a unique ID that is saved on the order when the customer picks it.
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
            onClick={() =>
              update({
                designs: [
                  ...(form.designs || []),
                  { id: newDesignId((form.designs || []).map((design) => design.id)), name: '', image: '', color: '' },
                ],
              })
            }
          >
            Add design
          </button>
        </div>
        {(form.designs || []).map((design, index) => (
          <div key={design.id || index} className="grid md:grid-cols-[96px_1fr_auto] gap-3 items-start border border-slate-100 rounded-xl p-3">
            <div className="relative w-24 h-28 bg-slate-100 rounded-lg overflow-hidden shrink-0">
              {design.image.trim() ? (
                <img
                  key={design.image.trim()}
                  src={design.image.trim()}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full flex items-center justify-center text-[10px] text-slate-400 px-2 text-center ${
                  design.image.trim() ? 'hidden' : ''
                }`}
              >
                {design.image.trim() ? 'Could not load photo' : 'No photo'}
              </div>
              {design.image.trim() ? (
                <button
                  type="button"
                  onClick={() => setCropSession({ mode: 'design', index, src: design.image.trim() })}
                  className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/75 text-white text-[10px] py-1 cursor-pointer"
                  title="Edit image"
                >
                  <Crop className="w-3 h-3" />
                  Edit
                </button>
              ) : null}
            </div>
            <div className="space-y-2 min-w-0">
              <p className="text-xs font-mono text-slate-500">ID {design.id || 'assigned on save'}</p>
              <input
                value={design.name}
                placeholder="Design name, e.g. Black floral"
                className={fieldClass}
                onChange={(e) => {
                  const value = e.target.value;
                  const designs = [...(form.designs || [])];
                  // If a photo URL is pasted into the name field, put it in the image field instead.
                  if (/^https?:\/\//i.test(value.trim()) && !designs[index].image.trim()) {
                    designs[index] = { ...designs[index], image: value.trim(), name: designs[index].name };
                    update({ designs });
                    return;
                  }
                  designs[index] = { ...designs[index], name: value };
                  update({ designs });
                }}
              />
              <label className="block">
                <span className="text-xs text-slate-500">Color</span>
                <input
                  value={design.color || ''}
                  placeholder="e.g. Pink"
                  list={`design-color-${design.id || index}`}
                  className={fieldClass}
                  onChange={(e) => {
                    const designs = [...(form.designs || [])];
                    designs[index] = { ...designs[index], color: e.target.value };
                    update({ designs });
                  }}
                />
                <datalist id={`design-color-${design.id || index}`}>
                  {form.colors
                    .filter((color) => color.name.trim())
                    .map((color) => (
                      <option key={color.name} value={color.name} />
                    ))}
                </datalist>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500">Design photo URL</span>
                <input
                  value={design.image}
                  placeholder="https://... or upload below"
                  className={fieldClass}
                  onChange={(e) => {
                    const designs = [...(form.designs || [])];
                    designs[index] = { ...designs[index], image: e.target.value };
                    update({ designs });
                  }}
                  onBlur={async (e) => {
                    const value = e.target.value.trim();
                    if (!value || value === design.image.trim()) return;
                    try {
                      const stored = await storeProductImage(value);
                      setForm((prev) => {
                        const designs = [...(prev.designs || [])];
                        const current = designs[index];
                        if (!current || (current.image.trim() !== value && current.image !== stored)) return prev;
                        designs[index] = { ...current, image: stored };
                        return { ...prev, designs };
                      });
                    } catch (err) {
                      notify(err instanceof Error ? err.message : 'Could not save the design photo.', 'error');
                    }
                  }}
                />
              </label>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                Upload design photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    const files = input.files;
                    if (!files?.length) return;
                    try {
                      const [fileUrl] = await readFiles(files);
                      const url = await storeProductImage(fileUrl);
                      setForm((prev) => {
                        const designs = [...(prev.designs || [])];
                        if (!designs[index]) return prev;
                        designs[index] = { ...designs[index], image: url };
                        return { ...prev, designs };
                      });
                      notify('Design photo saved.', 'success');
                    } catch (err) {
                      notify(err instanceof Error ? err.message : 'Could not upload the design photo.', 'error');
                    } finally {
                      input.value = '';
                    }
                  }}
                />
              </label>
            </div>
            <button
              type="button"
              className="text-sm text-rose-700"
              onClick={() => update({ designs: (form.designs || []).filter((_, i) => i !== index) })}
            >
              Remove
            </button>
          </div>
        ))}
        {!(form.designs || []).length && (
          <p className="text-xs text-slate-400">No extra designs. Customers will order this product as a single look.</p>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Colors</h3>
            <p className="text-xs text-slate-400 mt-1">
              {form.hasColors !== false
                ? 'Same product in more colors? Click Add color for each one and upload its photos — customers see those photos when they pick that color.'
                : 'Color options are hidden. Customers buy this product without choosing a color.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.hasColors !== false}
                onChange={(e) => update({ hasColors: e.target.checked })}
              />
              Show color options
            </label>
            {form.hasColors !== false && (
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm w-fit"
                onClick={() =>
                  update({
                    colors: [...form.colors, { name: '', hex: '#888888' }],
                  })
                }
              >
                Add color
              </button>
            )}
          </div>
        </div>

        {form.hasColors !== false && (
        <>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.15em] font-semibold text-slate-700 mb-3">
            Color:{' '}
            <span className="font-normal text-slate-500">
              {form.colors.find((c) => c.name.trim())?.name || '—'}
            </span>
          </p>
          <div className="flex gap-3 items-center flex-wrap">
            {form.colors
              .filter((c) => c.name.trim())
              .map((color, index) => (
                <span
                  key={`${color.name}-${index}`}
                  title={color.name}
                  className={`w-8 h-8 rounded-full ${
                    index === 0 ? 'ring-2 ring-offset-2 ring-black' : 'border border-slate-300'
                  }`}
                  style={{ backgroundColor: color.hex || '#000000' }}
                />
              ))}
            {!form.colors.some((c) => c.name.trim()) && (
              <span className="text-xs text-slate-400">Add a named color to preview swatches.</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {form.colors.map((color, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[auto_1fr_140px_auto] gap-3 items-end border border-slate-100 rounded-xl p-3"
            >
              <div className="block">
                <span className="text-xs text-slate-500">Swatch</span>
                <button
                  type="button"
                  onClick={() => setOpenColorPicker((open) => (open === index ? null : index))}
                  aria-expanded={openColorPicker === index}
                  aria-label={`Choose color ${index + 1}`}
                  className={`mt-1.5 flex h-10 w-10 items-center justify-center rounded-full border cursor-pointer ${
                    openColorPicker === index ? 'ring-2 ring-offset-2 ring-black border-black' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: HEX_PATTERN.test(color.hex) ? color.hex : '#000000' }}
                />
              </div>
              <label className="block">
                <span className="text-xs text-slate-500">Color name</span>
                <input
                  value={color.name}
                  onChange={(e) => {
                    const colors = [...form.colors];
                    colors[index] = { ...colors[index], name: e.target.value };
                    update({ colors });
                  }}
                  placeholder="Onyx Black"
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500">Hex</span>
                <input
                  value={color.hex}
                  onChange={(e) => {
                    const colors = [...form.colors];
                    colors[index] = { ...colors[index], hex: e.target.value };
                    update({ colors });
                  }}
                  placeholder="#000000"
                  className={fieldClass}
                />
              </label>
              <button
                type="button"
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm h-10"
                onClick={() => {
                  if (form.colors.length <= 1) {
                    notify('Keep at least one color option.', 'error');
                    return;
                  }
                  setOpenColorPicker(null);
                  update({ colors: form.colors.filter((_, i) => i !== index) });
                }}
              >
                Remove
              </button>
              <div className="md:col-span-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Photos for this color{color.name.trim() ? ` (${color.name.trim()})` : ''}
                  </span>
                  <label className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs cursor-pointer hover:bg-slate-50">
                    Upload photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const input = e.currentTarget;
                        if (!input.files?.length) return;
                        try {
                          const urls = await readFiles(input.files);
                          const stored: string[] = [];
                          for (const fileUrl of urls) stored.push(await storeProductImage(fileUrl));
                          setForm((prev) => {
                            const colors = [...prev.colors];
                            colors[index] = {
                              ...colors[index],
                              images: [...(colors[index].images || []).filter(Boolean), ...stored],
                            };
                            return { ...prev, colors };
                          });
                        } catch (err) {
                          notify(err instanceof Error ? err.message : 'Could not upload one or more images.', 'error');
                        } finally {
                          input.value = '';
                        }
                      }}
                    />
                  </label>
                  {!color.images?.filter(Boolean).length && (
                    <span className="text-xs text-slate-400">No photos yet — the main product images will be shown.</span>
                  )}
                </div>
                {Boolean(color.images?.filter(Boolean).length) && (
                  <div className="flex gap-2 flex-wrap">
                    {color.images!.filter(Boolean).map((src, imageIndex) => (
                      <div key={`${imageIndex}-${src.slice(-24)}`} className="relative">
                        <img src={src} alt="" className="w-16 h-20 object-cover rounded-lg bg-slate-100" />
                        <button
                          type="button"
                          aria-label="Remove photo"
                          onClick={() => {
                            const colors = [...form.colors];
                            colors[index] = {
                              ...colors[index],
                              images: (colors[index].images || []).filter(Boolean).filter((_, i) => i !== imageIndex),
                            };
                            update({ colors });
                          }}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-black text-white text-xs leading-5 text-center cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {openColorPicker === index && (
                <div className="md:col-span-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pick a color</p>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((preset) => {
                      const selected = color.hex.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          title={preset.name}
                          onClick={() => setColorAt(index, preset.hex, preset.name)}
                          className={`h-8 w-8 rounded-full border cursor-pointer ${
                            selected ? 'ring-2 ring-offset-2 ring-black border-black' : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input
                        type="color"
                        value={HEX_PATTERN.test(color.hex) ? color.hex : '#000000'}
                        onChange={(e) => setColorAt(index, e.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                      />
                      Custom color
                    </label>
                    <button
                      type="button"
                      onClick={() => setOpenColorPicker(null)}
                      className="ml-auto px-3 py-1.5 rounded-lg bg-black text-white text-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        </>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 grid md:grid-cols-3 gap-4">
        <h3 className="md:col-span-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Inventory & availability</h3>
        <label className="block">
          <span className="text-sm">Original price</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.listPrice}
            onChange={(e) => update({ listPrice: Number(e.target.value) })}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="text-sm">Stock quantity</span>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => update({ stock: Number(e.target.value) })}
            className={fieldClass}
          />
        </label>
        <label className="flex items-center gap-2 mt-7">
          <input type="checkbox" checked={form.active} onChange={(e) => update({ active: e.target.checked })} />
          <span className="text-sm">Product active on storefront</span>
        </label>
        <p className="md:col-span-3 text-xs text-slate-500">
          {form.stock <= 0 ? 'Status: Out of stock' : form.stock <= 5 ? 'Status: Low stock' : 'Status: In stock'}
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Sizes & price per size</h3>
            <p className="text-xs text-slate-400 mt-1">
              {form.hasSizes !== false
                ? `Set any sizes you sell (XS–XXXL, Free Size, or custom like 28 / 30). Leave price empty to use ${formatINR(form.listPrice || 0, true)}. Uncheck Available for out-of-stock sizes. Sale discount applies to every size.`
                : 'Size options are hidden. Customers buy this product without choosing a size; availability follows the Stock field.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.hasSizes !== false}
                onChange={(e) => update({ hasSizes: e.target.checked })}
              />
              Show size options
            </label>
            {form.hasSizes !== false && (
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm w-fit"
                onClick={() => update({ sizes: [...form.sizes, { size: '', available: true }] })}
              >
                Add custom size
              </button>
            )}
          </div>
        </div>
        {form.hasSizes !== false && (
          <div className="flex flex-wrap gap-2">
            {CLOTHING_SIZE_PRESETS.map((preset) => {
              const exists = form.sizes.some((s) => s.size.trim().toUpperCase() === preset.toUpperCase());
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={exists}
                  className={`px-3 py-1.5 rounded-full text-xs border ${
                    exists
                      ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                      : 'border-slate-200 text-slate-700 hover:border-slate-900 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    if (exists) return;
                    update({ sizes: [...form.sizes, { size: preset, available: true }] });
                  }}
                >
                  + {preset}
                </button>
              );
            })}
          </div>
        )}
        {form.hasSizes !== false && form.sizes.map((s, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-end border border-slate-100 rounded-xl p-3"
          >
            <label className="block">
              <span className="text-xs text-slate-500">Size</span>
              <input
                value={s.size}
                onChange={(e) => {
                  const sizes = [...form.sizes];
                  sizes[index] = { ...sizes[index], size: e.target.value };
                  update({ sizes });
                }}
                placeholder="M / XL / 28"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Price (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={s.price ?? ''}
                placeholder={String(form.listPrice || '')}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : Number(e.target.value);
                  const sizes = [...form.sizes];
                  sizes[index] = { ...sizes[index], price: value && value > 0 ? value : undefined };
                  update({ sizes });
                }}
                className={fieldClass}
              />
            </label>
            <label className="flex items-center gap-2 h-10">
              <input
                type="checkbox"
                checked={s.available}
                onChange={(e) => {
                  const sizes = [...form.sizes];
                  sizes[index] = { ...sizes[index], available: e.target.checked };
                  update({ sizes });
                }}
              />
              <span className="text-sm">Available</span>
            </label>
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm h-10"
              onClick={() => {
                if (form.sizes.length <= 1) {
                  notify('Keep at least one size.', 'error');
                  return;
                }
                update({ sizes: form.sizes.filter((_, i) => i !== index) });
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 grid md:grid-cols-2 gap-4">
        <h3 className="md:col-span-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Return & replacement
        </h3>
        <label className="block">
          <span className="text-sm">Return / replacement policy</span>
          <select
            value={form.returnPolicy || 'return_and_replace'}
            onChange={(e) => update({ returnPolicy: e.target.value as ReturnPolicy })}
            className={fieldClass}
          >
            {RETURN_POLICY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-slate-500 md:mt-7">
          Customers cannot send a return or replace request that this product does not allow. The policy is also shown
          on the product page.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 grid md:grid-cols-2 gap-4">
        <h3 className="md:col-span-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Sale & discount</h3>
        <label className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            checked={form.saleEnabled}
            onChange={(e) =>
              update({
                saleEnabled: e.target.checked,
                discountEnabled: e.target.checked ? true : form.discountEnabled,
              })
            }
          />
          <span className="text-sm font-medium">Sale ON</span>
          <span className="text-xs text-slate-400">— turns discount on for customers (Amazon-style -% price)</span>
        </label>
        <label className="block">
          <span className="text-sm">Discount type</span>
          <select
            value={form.discountType}
            onChange={(e) => update({ discountType: e.target.value === 'amount' ? 'amount' : 'percent' })}
            className={fieldClass}
          >
            <option value="percent">Percentage (e.g. 77%)</option>
            <option value="amount">Custom amount (₹ off)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm">{form.discountType === 'amount' ? 'Discount amount (₹)' : 'Discount percentage (%)'}</span>
          <input
            type="number"
            min="0"
            step="1"
            value={Number.isFinite(form.discountValue) ? Math.round(form.discountValue) : 0}
            onChange={(e) =>
              update({
                discountValue: Math.round(Number(e.target.value) || 0),
                discountEnabled: true,
              })
            }
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="text-sm">Sale start (optional)</span>
          <input
            type="date"
            value={/^\d{4}-\d{2}-\d{2}$/.test(form.saleStart) ? form.saleStart : ''}
            onChange={(e) => update({ saleStart: e.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="text-sm">Sale end (optional)</span>
          <input
            type="date"
            value={/^\d{4}-\d{2}-\d{2}$/.test(form.saleEnd) ? form.saleEnd : ''}
            onChange={(e) => update({ saleEnd: e.target.value })}
            className={fieldClass}
          />
        </label>
        <div className="md:col-span-2 rounded-xl bg-slate-50 px-4 py-4 space-y-2">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Customer price preview</p>
          {(form.listPrice || 0) > 0 && form.discountValue > 0 && salePrice < (form.listPrice || 0) ? (
            <>
              <AmazonSalePrice listPrice={form.listPrice || 0} salePrice={salePrice} />
              <p className="text-xs text-slate-500">
                Was {formatINR(form.listPrice || 0)} · save {discountPercentOff(form.listPrice || 0, salePrice)}%
                {!form.saleEnabled ? (
                  <span className="text-amber-700"> — turn Sale ON to show this on the storefront.</span>
                ) : (
                  <span className="text-emerald-700"> — live on storefront when dates allow.</span>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Set original price and a discount value to preview. Example: list ₹999, 77% → shows as{' '}
              <span className="inline-block align-middle">
                <AmazonSalePrice listPrice={999} salePrice={229} />
              </span>
            </p>
          )}
        </div>
      </section>

      <div className="sticky bottom-0 z-20 flex gap-3 py-4 bg-slate-100">
        <button
          type="button"
          onClick={save}
          className="bg-slate-950 text-white px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer relative z-20 hover:bg-black"
        >
          {existing ? 'Save changes' : 'Create product'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm cursor-pointer hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
