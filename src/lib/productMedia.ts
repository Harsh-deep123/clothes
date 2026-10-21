import type { AdminProduct } from '../catalog';
import { getAdminToken } from '../adminAuth';

export function isStoredProductImage(url: string) {
  return /^\/api\/admin\/media\/[0-9a-f-]{36}$/i.test(url.trim());
}

export async function storeProductImage(source: string): Promise<string> {
  const value = source.trim();
  if (!value || isStoredProductImage(value)) return value;
  const dataUrl = value.startsWith('data:image/');
  const remote = /^https?:\/\//i.test(value);
  if (!dataUrl && !remote) return value;

  const token = getAdminToken();
  if (!token) throw new Error('Sign in again so this photo can be saved.');

  const response = await fetch('/api/admin/media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dataUrl ? { dataUrl: value } : { sourceUrl: value }),
  });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error || 'Could not save the image.');
  }
  return data.url;
}

async function storeList(urls: string[] | undefined) {
  const next: string[] = [];
  for (const url of urls || []) {
    if (!url.trim()) continue;
    next.push(await storeProductImage(url));
  }
  return next;
}

export async function storeProductImages(product: AdminProduct): Promise<AdminProduct> {
  return {
    ...product,
    images: await storeList(product.images),
    colors: await Promise.all(
      product.colors.map(async (color) =>
        color.images?.length ? { ...color, images: await storeList(color.images) } : color
      )
    ),
    designs: await Promise.all(
      (product.designs || []).map(async (design) => ({
        ...design,
        image: design.image.trim() ? await storeProductImage(design.image) : design.image,
      }))
    ),
  };
}

export async function saveProductRecord(product: AdminProduct) {
  const token = getAdminToken();
  if (!token) throw new Error('Sign in again so this product can be saved.');
  const response = await fetch('/api/admin/products', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not save the product in the database.');
}
