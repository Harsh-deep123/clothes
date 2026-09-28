import React, { useState } from 'react';
import { Mail, Clock, MapPin } from 'lucide-react';
import { LocalAccount, PlacedOrder, ViewScreen } from '../../types';
import { BodyText, InfoPageShell, SectionHeading } from './InfoPageShell';
import {
  findOrderByNumber,
  formatOrderAddress,
  orderProductSummary,
  submitReturnRequest,
} from '../../lib/returnRequests';
import type { ReturnRequestType } from '../../types/returnRequest';
import { policyAllows, productReturnPolicy } from '../../catalog';

function splitByPolicy(order: PlacedOrder | undefined, requestType: ReturnRequestType) {
  const items = order?.items || [];
  const eligible = items.filter((item) => policyAllows(productReturnPolicy(item.productId), requestType));
  const blocked = items.filter((item) => !eligible.includes(item));
  return { eligible, blocked };
}

interface ContactPageProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
  onMessageSent: (name: string) => void;
  account?: LocalAccount | null;
  orders?: PlacedOrder[];
}

const inputClass =
  'w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';
const labelClass = 'text-xs uppercase tracking-[0.15em] font-semibold text-black mb-2 block';

export const ContactPage: React.FC<ContactPageProps> = ({
  onNavigate,
  onMessageSent,
  account,
  orders = [],
}) => {
  const [form, setForm] = useState({
    fullName: account?.fullName || '',
    email: account?.email || '',
    phone: account?.phone || '',
    orderNumber: '',
    subject: '',
    message: '',
    requestType: 'return' as ReturnRequestType,
    address: '',
    productName: '',
    productDetails: '',
    reason: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isReturnSubject = form.subject === 'returns';
  const matchedOrder = findOrderByNumber(orders, form.orderNumber);
  const policySplit = splitByPolicy(matchedOrder, form.requestType);
  const requestLabel = form.requestType === 'replace' ? 'replacement' : 'return';

  const applyOrderMatch = (orderNumber: string, current = form) => {
    const matched = findOrderByNumber(orders, orderNumber);
    if (!matched) return current;
    const products = orderProductSummary(matched, splitByPolicy(matched, current.requestType).eligible);
    return {
      ...current,
      orderNumber,
      fullName: current.fullName || matched.customer.fullName,
      email: current.email || matched.customer.email,
      phone: current.phone || matched.customer.phone,
      address: current.address || formatOrderAddress(matched),
      productName: current.productName || products.name,
      productDetails: current.productDetails || products.details,
    };
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'requestType' && findOrderByNumber(orders, prev.orderNumber)) {
        return applyOrderMatch(prev.orderNumber, { ...next, productName: '', productDetails: '' });
      }
      if (name === 'orderNumber' || name === 'subject') {
        return applyOrderMatch(name === 'orderNumber' ? value : prev.orderNumber, next);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (isReturnSubject) {
      const matched = findOrderByNumber(orders, form.orderNumber);
      const { eligible, blocked } = splitByPolicy(matched, form.requestType);
      if (matched && eligible.length === 0) {
        setSubmitError(`The products in this order are not eligible for ${requestLabel}.`);
        return;
      }
      setSubmitting(true);
      try {
        const products = orderProductSummary(matched, eligible);
        const restrictToEligible = Boolean(matched && blocked.length);
        await submitReturnRequest({
          requestType: form.requestType,
          orderNumber: form.orderNumber.trim(),
          customerName: form.fullName.trim(),
          customerPhone: form.phone.trim(),
          customerEmail: form.email.trim(),
          customerAddress: form.address.trim() || formatOrderAddress(matched),
          productName: restrictToEligible ? products.name : form.productName.trim() || products.name,
          productDetails: restrictToEligible ? products.details : form.productDetails.trim() || products.details,
          reason: form.reason.trim() || form.message.trim(),
          additionalMessage: form.message.trim(),
          orderMatched: Boolean(matched),
        });
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Could not send this request.');
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    setSubmitted(true);
    onMessageSent(form.fullName);
    setForm({
      fullName: account?.fullName || '',
      email: account?.email || '',
      phone: account?.phone || '',
      orderNumber: '',
      subject: '',
      message: '',
      requestType: 'return',
      address: '',
      productName: '',
      productDetails: '',
      reason: '',
    });
  };

  return (
    <InfoPageShell
      eyebrow="Support"
      title="CONTACT ZAYRO"
      intro="Our concierge team is here to assist with orders, fit, and collection enquiries. We typically respond within one business day."
      onNavigate={onNavigate}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={form.fullName}
              onChange={handleChange}
              placeholder="Alexander Vance"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="email" className={labelClass}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@email.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 (000) 000-0000"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="orderNumber" className={labelClass}>
                Order Number{' '}
                {isReturnSubject ? null : <span className="font-light text-[#5d5f5f]">(Optional)</span>}
              </label>
              <input
                id="orderNumber"
                name="orderNumber"
                type="text"
                required={isReturnSubject}
                value={form.orderNumber}
                onChange={handleChange}
                placeholder="ZAY-000000"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="subject" className={labelClass}>
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={form.subject}
                onChange={handleChange}
                className={`${inputClass} bg-white`}
              >
                <option value="">Select a subject</option>
                <option value="order">Order Enquiry</option>
                <option value="shipping">Shipping & Delivery</option>
                <option value="returns">Returns & Exchanges</option>
                <option value="sizing">Fit & Size Guide</option>
                <option value="other">General</option>
              </select>
            </div>
          </div>

          {isReturnSubject && (
            <>
              <div>
                <label htmlFor="requestType" className={labelClass}>
                  Request Type
                </label>
                <select
                  id="requestType"
                  name="requestType"
                  required
                  value={form.requestType}
                  onChange={handleChange}
                  className={`${inputClass} bg-white`}
                >
                  <option value="return">Return Request</option>
                  <option value="replace">Replace Request</option>
                </select>
                {matchedOrder && policySplit.blocked.length > 0 && (
                  <p className="mt-2 text-sm text-[#ba1a1a] font-light">
                    {policySplit.eligible.length === 0
                      ? `The products in this order are not eligible for ${requestLabel}.`
                      : `Not eligible for ${requestLabel}: ${policySplit.blocked
                          .map((item) => item.product.name)
                          .join(', ')}. Your request will include only the eligible products.`}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="address" className={labelClass}>
                  Complete Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                  placeholder="House / street, city, state, postal code, country"
                  className={`${inputClass} resize-y min-h-[88px]`}
                />
              </div>
              <div>
                <label htmlFor="productName" className={labelClass}>
                  Product Name
                </label>
                <input
                  id="productName"
                  name="productName"
                  type="text"
                  required
                  value={form.productName}
                  onChange={handleChange}
                  placeholder="Product from your order"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="productDetails" className={labelClass}>
                  Product Details
                </label>
                <textarea
                  id="productDetails"
                  name="productDetails"
                  rows={3}
                  value={form.productDetails}
                  onChange={handleChange}
                  placeholder="Size, color, quantity, or other item details"
                  className={`${inputClass} resize-y min-h-[88px]`}
                />
              </div>
              <div>
                <label htmlFor="reason" className={labelClass}>
                  Reason for Return / Replacement
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  required
                  rows={3}
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Why are you requesting a return or replacement?"
                  className={`${inputClass} resize-y min-h-[88px]`}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="message" className={labelClass}>
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              value={form.message}
              onChange={handleChange}
              placeholder="How may we assist you?"
              className={`${inputClass} resize-y min-h-[140px]`}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-black text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95 w-full sm:w-auto disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send Message'}
          </button>

          {submitError && <p className="text-sm text-[#ba1a1a] font-light">{submitError}</p>}

          {submitted && (
            <p className="text-sm text-[#5d5f5f] font-light">
              Thank you. Your message has been received. A member of our team will be in touch shortly.
            </p>
          )}
        </form>

        <aside className="lg:col-span-5 space-y-10">
          <div className="border border-[#cfc4c5]/30 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 stroke-[1.5]" />
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-black">
                Email Support
              </h3>
            </div>
            <BodyText>
              For order updates, returns, and product advice, write to our client services desk.
            </BodyText>
            <p className="mt-4 text-sm text-black">support@zayrocollection.com</p>
            <p className="text-sm text-[#5d5f5f] font-light">press@zayrocollection.com</p>
          </div>

          <div className="border border-[#cfc4c5]/30 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 stroke-[1.5]" />
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-black">
                Business Hours
              </h3>
            </div>
            <BodyText className="mb-3">Monday – Friday: 9:00 AM – 6:00 PM EST</BodyText>
            <BodyText>Saturday: 10:00 AM – 4:00 PM EST</BodyText>
            <BodyText className="mt-3">Closed Sundays and public holidays.</BodyText>
          </div>

          <div className="border border-[#cfc4c5]/30 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 stroke-[1.5]" />
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-black">
                Atelier Correspondence
              </h3>
            </div>
            <BodyText>
              ZAYRO Store
              <br />
              740 Park Avenue, Suite 14
              <br />
              New York, NY 10021
              <br />
              United States
            </BodyText>
          </div>

          <div>
            <SectionHeading>Need quicker help?</SectionHeading>
            <BodyText className="mb-4">
              For shipping times, returns eligibility, or measurements, visit our policy pages before writing in.
            </BodyText>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => onNavigate('shipping')}
                className="text-xs uppercase tracking-[0.15em] font-medium text-[#5d5f5f] hover:text-black hover:underline text-left cursor-pointer"
              >
                Shipping
              </button>
              <button
                type="button"
                onClick={() => onNavigate('returns')}
                className="text-xs uppercase tracking-[0.15em] font-medium text-[#5d5f5f] hover:text-black hover:underline text-left cursor-pointer"
              >
                Returns
              </button>
              <button
                type="button"
                onClick={() => onNavigate('size-guide')}
                className="text-xs uppercase tracking-[0.15em] font-medium text-[#5d5f5f] hover:text-black hover:underline text-left cursor-pointer"
              >
                Size Guide
              </button>
            </div>
          </div>
        </aside>
      </div>
    </InfoPageShell>
  );
};
