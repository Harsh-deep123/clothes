import { useEffect, useState } from 'react';
import {
  AdminProduct,
  getAdminCategories,
  getCatalog,
  getStorefrontProducts,
  subscribeCatalog,
} from '../catalog';
import { CategoryInfo, Product } from '../types';

export function useCatalogTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeCatalog(() => setTick((n) => n + 1)), []);
  return tick;
}

export function useStorefrontProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(() => getStorefrontProducts());
  useEffect(() => subscribeCatalog(() => setProducts(getStorefrontProducts())), []);
  return products;
}

export function useAdminCatalog(): AdminProduct[] {
  const [products, setProducts] = useState<AdminProduct[]>(() => getCatalog());
  useEffect(() => subscribeCatalog(() => setProducts(getCatalog())), []);
  return products;
}

export function useAdminCategories(): CategoryInfo[] {
  const [categories, setCategories] = useState<CategoryInfo[]>(() => getAdminCategories());
  useEffect(() => subscribeCatalog(() => setCategories(getAdminCategories())), []);
  return categories;
}
