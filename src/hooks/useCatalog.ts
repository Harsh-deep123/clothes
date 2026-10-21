import { useEffect, useState } from 'react';
import {
  AdminProduct,
  getAdminCategories,
  getCatalog,
  getStorefrontProducts,
  hydrateCatalogFromServer,
  subscribeCatalog,
} from '../catalog';
import { CategoryInfo, Product } from '../types';

export function useCatalogTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribeCatalog(() => setTick((n) => n + 1));
    void hydrateCatalogFromServer().catch(() => undefined);
    return unsub;
  }, []);
  return tick;
}

export function useStorefrontProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(() => getStorefrontProducts());
  useEffect(() => {
    const unsub = subscribeCatalog(() => setProducts(getStorefrontProducts()));
    void hydrateCatalogFromServer().catch(() => undefined);
    return unsub;
  }, []);
  return products;
}

export function useAdminCatalog(): AdminProduct[] {
  const [products, setProducts] = useState<AdminProduct[]>(() => getCatalog());
  useEffect(() => {
    const unsub = subscribeCatalog(() => setProducts(getCatalog()));
    void hydrateCatalogFromServer().catch(() => undefined);
    return unsub;
  }, []);
  return products;
}

export function useAdminCategories(): CategoryInfo[] {
  const [categories, setCategories] = useState<CategoryInfo[]>(() => getAdminCategories());
  useEffect(() => subscribeCatalog(() => setCategories(getAdminCategories())), []);
  return categories;
}
