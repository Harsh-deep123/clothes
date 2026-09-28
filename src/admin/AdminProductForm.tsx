import React, { useMemo, useState } from 'react';
import {
  AdminProduct,
  calculateSalePrice,
  getCatalogProduct,
  RETURN_POLICY_OPTIONS,
  slugify,
  upsertProduct,
} from '../catalog';
import type { ReturnPolicy } from '../types';
import { useAdminCategories } from '../hooks/useCatalog';
import { formatINR } from '../lib/money';

interface AdminProductFormProps {
  productId?: string | null;
  onCancel: () => void;
  onSaved: () => void;
  notify: (message: string, type: 'success' | 'error') => void;
}

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
    { size: 'S', available: true },
    { size: 'M', available: true },
    { size: 'L', available: true },
    { size: 'XL', available: true },
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

  const update = (patch: Partial<AdminProduct>) => setForm((prev) => ({ ...prev, ...patch }));

  const applyCategory = (slug: string) => {
    const cat = categories.find((c) => c.slug === slug);
    update({
      category: slug,
      categoryLabel: cat?.name || slug,
      breadcrumb: `Men / ${cat?.name || slug}`,
    });
  };

  const save = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    const nextErrors: string[] = [];
    if (!form.name.trim()) nextErrors.push('Product name is required.');
    if (!form.description.trim()) nextErrors.push('Description is required.');
    if (!(form.listPrice > 0)) nextErrors.push('Original price must be greater than 0.');
    if (form.stock < 0) nextErrors.push('Stock cannot be negative.');
    const images = form.images.filter(Boolean);
    if (!images.length) nextErrors.push('Add at least one product image.');
    const colors = form.colors.filter((c) => c.name.trim());
    if (!colors.length) nextErrors.push('Add at least one color option.');
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
      colors: colors.map((c) => ({
        name: c.name.trim(),
        hex: c.hex || '#000000',
        border: c.border,
      })),
      sizes: sizes.length ? sizes.map((s) => ({ ...s, size: s.size.trim() })) : form.sizes,
      hasSizes: showSizes,
      detailsAndCare: form.detailsAndCare.filter(Boolean),
      price: form.saleEnabled && form.discountEnabled ? salePrice : form.listPrice,
      isSale: Boolean(form.saleEnabled && form.discountEnabled && form.discountValue),
    };
    try {
      upsertProduct(payload);
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

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Images</h3>
        {form.images.map((url, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={url}
              onChange={(e) => {
                const images = [...form.images];
                images[index] = e.target.value;
                update({ images });
              }}
              placeholder="Image URL"
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
        <div className="flex flex-wrap gap-2">
          <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 text-sm" onClick={() => update({ images: [...form.images, ''] })}>
            Add image URL
          </button>
          <label className="px-4 py-2 rounded-xl border border-slate-200 text-sm cursor-pointer">
            Upload images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                if (!e.target.files?.length) return;
                try {
                  const urls = await readFiles(e.target.files);
                  update({ images: [...form.images.filter(Boolean), ...urls] });
                } catch {
                  notify('Could not upload one or more images.', 'error');
                }
              }}
            />
          </label>
        </div>
        <div className="flex gap-2 flex-wrap">
          {form.images.filter(Boolean).map((src) => (
            <img key={src.slice(0, 40)} src={src} alt="" className="w-16 h-20 object-cover rounded-lg bg-slate-100" />
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Colors</h3>
            <p className="text-xs text-slate-400 mt-1">These swatches appear on the product page as Color: Name.</p>
          </div>
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
        </div>

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
              <label className="block">
                <span className="text-xs text-slate-500">Swatch</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(color.hex) ? color.hex : '#000000'}
                    onChange={(e) => {
                      const colors = [...form.colors];
                      colors[index] = { ...colors[index], hex: e.target.value };
                      update({ colors });
                    }}
                    className="h-10 w-10 rounded-full border border-slate-200 p-0 bg-transparent cursor-pointer"
                    aria-label={`Color swatch ${index + 1}`}
                  />
                  <span
                    className="w-8 h-8 rounded-full border border-slate-300"
                    style={{ backgroundColor: color.hex || '#000000' }}
                  />
                </div>
              </label>
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
                  update({ colors: form.colors.filter((_, i) => i !== index) });
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Sizes & price per size</h3>
            <p className="text-xs text-slate-400 mt-1">
              {form.hasSizes !== false
                ? `Leave the price empty to use the original price (${formatINR(form.listPrice || 0, true)}). Sale discount applies to every size.`
                : 'Size options are hidden. Customers buy this product without choosing a size; availability follows the Stock field.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
                Add size
              </button>
            )}
          </div>
        </div>
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
                  sizes[index] = { ...sizes[index], size: e.target.value.toUpperCase() };
                  update({ sizes });
                }}
                placeholder="M"
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
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.discountEnabled} onChange={(e) => update({ discountEnabled: e.target.checked })} />
          <span className="text-sm">Enable discount</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.saleEnabled} onChange={(e) => update({ saleEnabled: e.target.checked })} />
          <span className="text-sm">Sale ON</span>
        </label>
        <label className="block">
          <span className="text-sm">Discount type</span>
          <select
            value={form.discountType}
            onChange={(e) => update({ discountType: e.target.value === 'amount' ? 'amount' : 'percent' })}
            className={fieldClass}
          >
            <option value="percent">Percentage</option>
            <option value="amount">Custom amount</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm">{form.discountType === 'amount' ? 'Discount amount (₹)' : 'Discount percentage (%)'}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.discountValue}
            onChange={(e) => update({ discountValue: Number(e.target.value) })}
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
        <div className="md:col-span-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          Calculated sale price: <strong>{formatINR(salePrice, true)}</strong>
          {!form.saleEnabled || !form.discountEnabled ? (
            <span className="text-slate-500"> — discount will not appear until Sale is ON and discount is enabled.</span>
          ) : null}
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
