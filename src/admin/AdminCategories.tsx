import React, { useState } from 'react';
import { slugify, saveAdminCategories } from '../catalog';
import { useAdminCategories } from '../hooks/useCatalog';
import { CategoryInfo } from '../types';

interface AdminCategoriesProps {
  notify: (message: string, type: 'success' | 'error') => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({ notify }) => {
  const categories = useAdminCategories();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify('Category name is required.', 'error');
      return;
    }
    const slug = slugify(name);
    if (categories.some((c) => c.slug === slug)) {
      notify('That category already exists.', 'error');
      return;
    }
    const next: CategoryInfo = {
      id: slug,
      name: name.trim(),
      slug,
      image: image.trim() || categories[0]?.image || '',
      description: description.trim() || name.trim(),
    };
    saveAdminCategories([...categories, next]);
    setName('');
    setDescription('');
    setImage('');
    notify('Category added.', 'success');
  };

  const update = (index: number, patch: Partial<CategoryInfo>) => {
    const next = categories.map((c, i) => (i === index ? { ...c, ...patch } : c));
    saveAdminCategories(next);
  };

  const remove = (slug: string) => {
    if (categories.length <= 1) {
      notify('Keep at least one category.', 'error');
      return;
    }
    saveAdminCategories(categories.filter((c) => c.slug !== slug));
    notify('Category removed.', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <form onSubmit={add} className="bg-white border border-slate-200 rounded-2xl p-5 grid md:grid-cols-2 gap-3">
        <h3 className="md:col-span-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Add category</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Image URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-slate-950 text-white rounded-xl px-4 py-2 text-sm w-fit">
          Add category
        </button>
      </form>

      <div className="space-y-3">
        {categories.map((c, index) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 grid md:grid-cols-[96px_1fr_auto] gap-4 items-center">
            <img src={c.image} alt="" className="w-24 h-24 object-cover rounded-xl bg-slate-100" />
            <div className="grid gap-2">
              <input
                value={c.name}
                onChange={(e) => update(index, { name: e.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={c.description}
                onChange={(e) => update(index, { description: e.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button type="button" onClick={() => remove(c.slug)} className="text-sm text-rose-600">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
