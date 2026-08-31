import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, ArrowRight, CreditCard, Lock } from 'lucide-react';
import { CartItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
}) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    email: 'alexander.v@zayro-atelier.com',
    firstName: 'Alexander',
    lastName: 'Vance',
    address: '740 Park Avenue, Apt 14B',
    city: 'New York',
    state: 'NY',
    zip: '10021',
    paymentMethod: 'card',
    cardNumber: '•••• •••• •••• 4092',
    expDate: '08/28',
    cvv: '•••',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');
      onOrderSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-white w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-[#cfc4c5]/30 z-10 p-6 sm:p-10 my-auto animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-black hover:opacity-60 transition-opacity"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' ? (
          <div>
            <div className="border-b border-[#cfc4c5]/30 pb-6 mb-8">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] block mb-1">
                Secure Checkout
              </span>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-black font-normal">
                Complete Your Order
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Left Column: Form (7 cols) */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
                {/* Contact */}
                <div>
                  <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-black mb-3">
                    1. Contact Details
                  </h3>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email Address"
                    className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none"
                  />
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-black mb-3">
                    2. Shipping Address
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="First Name"
                      className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Last Name"
                      className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street Address & Apt/Suite"
                    className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none mb-3"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                      className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      placeholder="ZIP Code"
                      className="w-full border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-black mb-3">
                    3. Payment Method
                  </h3>
                  <div className="border border-[#cfc4c5] p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-black" />
                        <span className="text-sm font-medium text-black">Encrypted Card</span>
                      </div>
                      <Lock className="w-3.5 h-3.5 text-[#5d5f5f]" />
                    </div>
                    <input
                      type="text"
                      value={formData.cardNumber}
                      disabled
                      className="w-full bg-[#f9f9f9] border border-[#cfc4c5] px-3 py-2 text-sm text-[#5d5f5f]"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formData.expDate}
                        disabled
                        className="w-full bg-[#f9f9f9] border border-[#cfc4c5] px-3 py-2 text-sm text-[#5d5f5f]"
                      />
                      <input
                        type="text"
                        value={formData.cvv}
                        disabled
                        className="w-full bg-[#f9f9f9] border border-[#cfc4c5] px-3 py-2 text-sm text-[#5d5f5f]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold py-4.5 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <span>Authorizing Payment...</span>
                  ) : (
                    <>
                      <span>Place Order • ${total.toFixed(2)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Right Column: Order Summary (5 cols) */}
              <div className="lg:col-span-5 bg-[#f9f9f9] p-6 border border-[#cfc4c5]/30 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif-luxury text-xl text-black mb-4 pb-3 border-b border-[#cfc4c5]/30">
                    Order Summary ({items.length})
                  </h3>
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3 text-xs">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-12 h-16 object-cover bg-white border border-[#cfc4c5]/20"
                        />
                        <div className="flex-grow">
                          <p className="font-medium text-black">{item.product.name}</p>
                          <p className="text-[#5d5f5f]">
                            {item.selectedColor} • Size: {item.selectedSize}
                          </p>
                          <p className="text-[#5d5f5f]">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-black">${item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#cfc4c5]/30 mt-6 pt-4 space-y-2 text-xs text-[#5d5f5f]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-black font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Express Shipping</span>
                      <span className="text-black font-medium">Complimentary</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Taxes</span>
                      <span className="text-black font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-black pt-3 border-t border-[#cfc4c5]/30">
                      <span>Total Due</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#cfc4c5]/20 flex items-center gap-2 text-[11px] text-[#5d5f5f]">
                  <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                  <span>256-bit TLS encrypted transaction with luxury garment insurance.</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Order Confirmation Screen */
          <div className="text-center py-12 px-4 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] block mb-2">
              Order Confirmed
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-black mb-4">
              Thank You, {formData.firstName}
            </h2>
            <p className="text-sm text-[#5d5f5f] leading-relaxed mb-6 font-light">
              Your order <span className="font-semibold text-black">#ZYR-984210</span> has been received and is being hand-prepared at our central atelier. A shipment tracking email will follow shortly.
            </p>

            <div className="bg-[#f9f9f9] p-4 border border-[#cfc4c5]/30 text-xs text-left mb-8 space-y-1 text-[#5d5f5f]">
              <p><strong className="text-black">Delivery to:</strong> {formData.address}, {formData.city}, {formData.state} {formData.zip}</p>
              <p><strong className="text-black">Estimated Arrival:</strong> 2-3 Business Days (White Glove Express)</p>
            </div>

            <button
              onClick={onClose}
              className="bg-black text-white px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
