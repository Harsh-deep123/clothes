import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import {
  AdminProduct,
  calculateSalePrice,
  deleteProduct,
  isSaleLive,
  LOW_STOCK_THRESHOLD,
} from '../catalog';
import { useAdminCatalog, useAdminCategories } from '../hooks/useCatalog';
import { formatINR } from '../lib/money';

interface AdminProductsProps {
  onCreate: () => void;
  onEdit: (id: string) => void;
  notify: (message: string, type: 'success' | 'error') => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ onCreate, onEdit, notify }) => {
  const products = useAdminCatalog();
  const categories = useAdminCategories();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sale, setSale] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null);

  const filtered = useMemo(() => {
    let list = [...products];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
      );
    }
    if (category !== 'all') list = list.filter((p) => p.category === category);
    if (sale === 'on') list = list.filter((p) => isSaleLive(p));
    if (sale === 'off') list = list.filter((p) => !isSaleLive(p));
    if (status === 'active') list = list.filter((p) => p.active);
    if (status === 'inactive') list = list.filter((p) => !p.active);
    if (status === 'oos') list = list.filter((p) => p.stock <= 0);
    if (status === 'low') list = list.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);

    if (sort === 'price-asc') list.sort((a, b) => calculateSalePrice(a) - calculateSalePrice(b));
    else if (sort === 'price-desc') list.sort((a, b) => calculateSalePrice(b) - calculateSalePrice(a));
    else if (sort === 'stock') list.sort((a, b) => a.stock - b.stock);
    else list = list;

    return list;
  }, [products, query, category, sale, status, sort]);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteProduct(pendingDelete.id);
    notify(`${pendingDelete.name} deleted.`, 'success');
    setPendingDelete(null);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 bg-slate-950 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={sale} onChange={(e) => setSale(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
          <option value="all">All sale statuses</option>
          <option value="on">Sale on</option>
          <option value="off">Sale off</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
          <option value="all">All availability</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="low">Low stock</option>
          <option value="oos">Out of stock</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="stock">Stock: low to high</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sale</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const live = isSaleLive(p);
              const salePrice = calculateSalePrice(p);
              const oos = p.stock <= 0;
              const low = p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD;
              return (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="w-12 h-16 object-cover rounded-lg bg-slate-100" />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.categoryLabel}</td>
                  <td className="px-4 py-3">
                    {live ? (
                      <span>
                        <span className="line-through text-slate-400 mr-2">{formatINR(p.listPrice)}</span>
                        <span className="text-rose-600 font-medium">{formatINR(salePrice)}</span>
                      </span>
                    ) : (
                      <span>{formatINR(p.listPrice)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={oos ? 'text-rose-600 font-medium' : low ? 'text-amber-600 font-medium' : ''}>
                      {p.stock}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {oos ? 'Out of stock' : low ? 'Low stock' : 'In stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        live ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {live ? 'On sale' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => onEdit(p.id)} className="p-2 rounded-lg border border-slate-200" aria-label="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(p)}
                        className="p-2 rounded-lg border border-rose-200 text-rose-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No products match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/50" aria-label="Cancel" onClick={() => setPendingDelete(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete product?</h3>
            <p className="text-sm text-slate-500 mb-6">
              {pendingDelete.name} will be removed from the catalog and storefront. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
