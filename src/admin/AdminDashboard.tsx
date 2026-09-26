import React, { useEffect, useState } from 'react';
import { AlertTriangle, BadgePercent, Package, PackageCheck, PackageX, Undo2 } from 'lucide-react';
import { catalogStats, LOW_STOCK_THRESHOLD } from '../catalog';
import { useAdminCatalog } from '../hooks/useCatalog';
import { fetchReturnRequests } from '../lib/returnRequests';

interface AdminDashboardProps {
  onOpenProducts: () => void;
  onOpenReturns: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenProducts, onOpenReturns }) => {
  useAdminCatalog();
  const stats = catalogStats();
  const [pendingReturns, setPendingReturns] = useState(0);

  useEffect(() => {
    fetchReturnRequests()
      .then((list) => setPendingReturns(list.filter((item) => item.status === 'pending').length))
      .catch(() => setPendingReturns(0));
  }, []);

  const cards = [
    { label: 'Total Products', value: stats.total, icon: Package, tone: 'bg-sky-50 text-sky-700', onClick: onOpenProducts },
    { label: 'Active Products', value: stats.active, icon: PackageCheck, tone: 'bg-emerald-50 text-emerald-700', onClick: onOpenProducts },
    { label: 'Products on Sale', value: stats.onSale, icon: BadgePercent, tone: 'bg-rose-50 text-rose-700', onClick: onOpenProducts },
    { label: 'Out of Stock', value: stats.outOfStock, icon: PackageX, tone: 'bg-slate-100 text-slate-700', onClick: onOpenProducts },
    { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700', onClick: onOpenProducts },
    { label: 'Pending Returns', value: pendingReturns, icon: Undo2, tone: 'bg-violet-50 text-violet-700', onClick: onOpenReturns },
  ];

  return (
    <div>
      <p className="text-sm text-slate-500 mb-6">
        Overview of catalog, inventory, and live sale status. Low stock is {LOW_STOCK_THRESHOLD} units or fewer.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex p-2 rounded-xl ${card.tone}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{card.value}</p>
              <p className="text-sm text-slate-500 mt-1">{card.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
