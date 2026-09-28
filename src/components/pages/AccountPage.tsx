import React, { useEffect, useState } from 'react';
import { AccountTab, LocalAccount, PlacedOrder, SavedAddress, ViewScreen } from '../../types';
import { formatINR } from '../../lib/money';
import { OrderTrackingModal } from '../OrderTrackingModal';
import { apiGetOrderTracking } from '../../lib/shopApi';
import { fetchPendingReviews, type PendingReviewItem } from '../../lib/reviewsApi';
import { PostPurchaseReviewPopup } from '../reviews/PostPurchaseReviewPopup';

interface AccountPageProps {
  account: LocalAccount;
  orders: PlacedOrder[];
  addresses: SavedAddress[];
  wishlistCount: number;
  tab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
  onNavigate: (screen: ViewScreen, category?: string) => void;
  onSaveProfile: (account: LocalAccount) => void;
  onSaveAddress: (address: SavedAddress) => void;
  onRemoveAddress: (id: string) => void;
  onLogout: () => void;
}

const TRACK_ORDER_KEY = 'zayro_track_order';

// Captured at load because the router rewrites the URL (dropping ?track=) before the page renders,
// and the customer may have to sign in first.
try {
  const fromQr = new URLSearchParams(window.location.search).get('track');
  if (fromQr) sessionStorage.setItem(TRACK_ORDER_KEY, fromQr.trim());
} catch {
  /* ignore */
}

const navItems: { id: AccountTab; label: string }[] = [
  { id: 'profile', label: 'My Profile' },
  { id: 'orders', label: 'My Orders' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'addresses', label: 'Saved Addresses' },
  { id: 'settings', label: 'Account Settings' },
];

const inputClass =
  'w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';

export const AccountPage: React.FC<AccountPageProps> = ({
  account,
  orders,
  addresses,
  wishlistCount,
  tab,
  onTabChange,
  onNavigate,
  onSaveProfile,
  onSaveAddress,
  onRemoveAddress,
  onLogout,
}) => {
  const [profile, setProfile] = useState(account);
  const [savedMsg, setSavedMsg] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<PlacedOrder | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewItems, setReviewItems] = useState<PendingReviewItem[]>([]);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    fullName: account.fullName,
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  const openTracking = (order: PlacedOrder) => {
    setTrackingOrder(order);
    setTrackingError(null);
    setTrackingLoading(true);
    void apiGetOrderTracking(order.id)
      .then((latest) => setTrackingOrder({ ...order, ...latest, items: latest.items.length ? latest.items : order.items }))
      .catch((err) => setTrackingError(err instanceof Error ? err.message : 'Could not load tracking.'))
      .finally(() => setTrackingLoading(false));
  };

  useEffect(() => {
    if (tab !== 'orders') return;
    const wanted = sessionStorage.getItem(TRACK_ORDER_KEY);
    if (!wanted) return;
    sessionStorage.removeItem(TRACK_ORDER_KEY);
    const needle = wanted.toLowerCase();
    const local = orders.find((o) => o.id.toLowerCase() === needle || o.number.toLowerCase() === needle);
    if (local) {
      openTracking(local);
      return;
    }
    void apiGetOrderTracking(wanted)
      .then((remote) => setTrackingOrder(remote))
      .catch(() => setReviewNotice(`Order ${wanted} was not found in this account.`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, orders]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({ ...account, ...profile, password: account.password });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full pb-20 md:pb-28">
      <h1 className="font-serif-luxury text-3xl sm:text-5xl tracking-tight uppercase text-black font-normal mb-10">
        My Account
      </h1>

      <div className="flex md:hidden gap-2 overflow-x-auto hide-scrollbar mb-8 pb-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() =>
              item.id === 'wishlist' ? onNavigate('wishlist') : onTabChange(item.id)
            }
            className={`shrink-0 px-4 py-2 text-xs uppercase tracking-[0.15em] border cursor-pointer ${
              tab === item.id && item.id !== 'wishlist'
                ? 'bg-black text-white border-black'
                : 'border-[#cfc4c5] text-[#5d5f5f]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <aside className="hidden md:block md:col-span-3">
          <nav className="flex flex-col gap-1 border border-[#cfc4c5]/30 bg-white p-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  item.id === 'wishlist' ? onNavigate('wishlist') : onTabChange(item.id)
                }
                className={`text-left px-4 py-3 text-xs uppercase tracking-[0.15em] cursor-pointer ${
                  tab === item.id && item.id !== 'wishlist'
                    ? 'bg-[#eeeeee] text-black font-semibold'
                    : 'text-[#5d5f5f] hover:text-black'
                }`}
              >
                {item.label}
                {item.id === 'wishlist' ? ` (${wishlistCount})` : ''}
              </button>
            ))}
          </nav>
        </aside>

        <div className="md:col-span-9">
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
              <h2 className="font-serif-luxury text-2xl mb-4">My Profile</h2>
              <input
                className={inputClass}
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="Full Name"
              />
              <input
                className={inputClass}
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="Email"
              />
              <input
                className={inputClass}
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Phone"
              />
              <button
                type="submit"
                className="bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold px-8 py-4"
              >
                Save Profile
              </button>
              {savedMsg && <p className="text-sm text-[#5d5f5f]">Saved on this device.</p>}
            </form>
          )}

          {tab === 'orders' && (
            <div>
              <h2 className="font-serif-luxury text-2xl mb-6">My Orders</h2>
              {reviewNotice && <p className="text-sm text-[#5d5f5f] mb-4">{reviewNotice}</p>}
              {orders.length === 0 ? (
                <p className="text-sm text-[#5d5f5f] font-light">You have no orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-[#cfc4c5]/30 bg-white p-5">
                      <div className="flex justify-between gap-4 mb-3">
                        <span className="font-medium text-black">{order.number}</span>
                        <span className="text-xs uppercase tracking-wider text-[#5d5f5f]">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-[#5d5f5f]">
                        {order.items.length} item{order.items.length === 1 ? '' : 's'} ·{' '}
                        {formatINR(order.total, true)}
                      </p>
                      <button
                        type="button"
                        className="mt-3 text-xs uppercase tracking-[0.15em] font-semibold text-black hover:underline"
                        onClick={() => openTracking(order)}
                      >
                        Track Order
                      </button>
                      <button
                        type="button"
                        className="mt-3 ml-5 text-xs uppercase tracking-[0.15em] font-semibold text-black hover:underline"
                        onClick={() => {
                          setReviewNotice(null);
                          void fetchPendingReviews(order.id)
                            .then((pending) => {
                              if (!pending.items.length) {
                                setReviewNotice(`All items in ${order.number} have already been reviewed.`);
                                return;
                              }
                              setReviewOrderId(pending.orderId || order.id);
                              setReviewItems(pending.items);
                            })
                            .catch((err) => {
                              setReviewNotice(err instanceof Error ? err.message : 'Could not open review form.');
                            });
                        }}
                      >
                        Write a Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'addresses' && (
            <div className="space-y-8">
              <h2 className="font-serif-luxury text-2xl">Saved Addresses</h2>
              {addresses.length === 0 && (
                <p className="text-sm text-[#5d5f5f] font-light">No addresses saved yet.</p>
              )}
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="border border-[#cfc4c5]/30 p-5 flex justify-between gap-4">
                    <div className="text-sm text-[#5d5f5f]">
                      <p className="text-black font-medium mb-1">{addr.label}</p>
                      <p>
                        {addr.fullName}
                        <br />
                        {addr.address}, {addr.city}, {addr.state} {addr.postalCode}
                        <br />
                        {addr.country}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAddress(addr.id)}
                      className="text-xs uppercase tracking-wider text-[#5d5f5f] hover:text-black h-fit"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <form
                className="space-y-3 max-w-lg"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newAddr.address || !newAddr.city) return;
                  onSaveAddress({ ...newAddr, id: `addr-${Date.now()}` });
                  setNewAddr({ ...newAddr, address: '', city: '', state: '', postalCode: '' });
                }}
              >
                <h3 className="text-xs uppercase tracking-[0.15em] font-semibold">Add Address</h3>
                <input
                  className={inputClass}
                  placeholder="Label"
                  value={newAddr.label}
                  onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Street Address"
                  value={newAddr.address}
                  onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={inputClass}
                    placeholder="City"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    required
                  />
                  <input
                    className={inputClass}
                    placeholder="State"
                    value={newAddr.state}
                    onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={inputClass}
                    placeholder="Postal Code"
                    value={newAddr.postalCode}
                    onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Country"
                    value={newAddr.country}
                    onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold px-8 py-4"
                >
                  Save Address
                </button>
              </form>
            </div>
          )}

          {tab === 'settings' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-serif-luxury text-2xl">Account Settings</h2>
              <p className="text-sm text-[#5d5f5f] font-light leading-relaxed">
                Your account is stored in our database. Signing out only clears the session on this device — your profile
                stays saved for the next login.
              </p>
              <button
                type="button"
                onClick={onLogout}
                className="border border-black text-black text-xs uppercase tracking-[0.2em] font-semibold px-8 py-4 hover:bg-[#eeeeee]"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      {trackingOrder && (
        <OrderTrackingModal
          order={trackingOrder}
          loading={trackingLoading}
          error={trackingError}
          onClose={() => setTrackingOrder(null)}
        />
      )}
      {reviewOrderId && reviewItems.length > 0 && (
        <PostPurchaseReviewPopup
          orderId={reviewOrderId}
          items={reviewItems}
          onSkipProduct={() => undefined}
          onCloseRemaining={() => {
            setReviewOrderId(null);
            setReviewItems([]);
          }}
        />
      )}
    </main>
  );
};
