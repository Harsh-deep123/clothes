import React from 'react';
import { ViewScreen } from '../../types';
import { BodyText, InfoPageShell, SectionHeading } from './InfoPageShell';

interface ShippingPageProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

export const ShippingPage: React.FC<ShippingPageProps> = ({ onNavigate }) => {
  return (
    <InfoPageShell
      eyebrow="Support"
      title="Shipping & Delivery"
      intro="Every ZAYRO piece is packed with care and dispatched from our atelier. Below is how orders move from confirmation to your door."
      onNavigate={onNavigate}
    >
      <div className="max-w-3xl space-y-12">
        <section>
          <SectionHeading>Shipping information</SectionHeading>
          <BodyText>
            Orders are fulfilled from our New York atelier. You will receive an email confirmation as soon as your
            order is placed, followed by a dispatch notice with tracking once the parcel leaves our studio.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Order processing time</SectionHeading>
          <BodyText>
            In-stock items are processed within 1–2 business days. Made-to-order or tailored pieces may require up to
            7–10 business days before dispatch. Orders placed after 2:00 PM EST, on weekends, or on public holidays
            begin processing the next business day.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Estimated delivery times</SectionHeading>
          <div className="overflow-x-auto border border-[#cfc4c5]/30 bg-white">
            <table className="w-full text-left text-sm border-collapse min-w-[480px]">
              <thead>
                <tr className="border-b border-black text-black uppercase tracking-wider text-xs font-semibold">
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Standard</th>
                  <th className="py-3 px-4">Express</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfc4c5]/30 font-light text-[#1a1c1c]">
                <tr className="hover:bg-[#f9f9f9]">
                  <td className="py-3 px-4">United States (contiguous)</td>
                  <td className="py-3 px-4">3–6 business days</td>
                  <td className="py-3 px-4">1–2 business days</td>
                </tr>
                <tr className="hover:bg-[#f9f9f9]">
                  <td className="py-3 px-4">Canada</td>
                  <td className="py-3 px-4">5–8 business days</td>
                  <td className="py-3 px-4">2–4 business days</td>
                </tr>
                <tr className="hover:bg-[#f9f9f9]">
                  <td className="py-3 px-4">United Kingdom & EU</td>
                  <td className="py-3 px-4">6–10 business days</td>
                  <td className="py-3 px-4">3–5 business days</td>
                </tr>
                <tr className="hover:bg-[#f9f9f9]">
                  <td className="py-3 px-4">Rest of world</td>
                  <td className="py-3 px-4">8–14 business days</td>
                  <td className="py-3 px-4">4–7 business days</td>
                </tr>
              </tbody>
            </table>
          </div>
          <BodyText className="mt-4">
            Delivery windows begin after the order has been dispatched, not from the date of purchase.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Standard shipping</SectionHeading>
          <BodyText>
            Complimentary standard shipping is offered on qualifying orders. Parcels are fully tracked and require a
            signature on selected high-value items. You will be notified if a signature is required.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Express shipping</SectionHeading>
          <BodyText>
            Express delivery is available at checkout for a flat fee. Cut-off for same-day dispatch on express orders
            is 12:00 PM EST on business days, subject to stock. Express does not apply to made-to-order garments.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Order tracking</SectionHeading>
          <BodyText>
            A tracking number is emailed when your order ships. Allow up to 24 hours for the carrier to register the
            first scan. If tracking has not updated after 48 hours, contact us with your order number.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Shipping delays</SectionHeading>
          <BodyText>
            Weather, customs, and peak seasonal periods may extend delivery times. ZAYRO is not responsible for delays
            once a parcel is with the carrier, but our concierge will help investigate missing or stalled shipments.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Incorrect address policy</SectionHeading>
          <BodyText>
            Please confirm your delivery address at checkout. If an order is returned due to an incomplete or incorrect
            address, we will contact you to arrange redelivery. Additional shipping charges may apply. Address changes
            can only be made before the order is dispatched.
          </BodyText>
        </section>

        <section>
          <SectionHeading>International shipping</SectionHeading>
          <BodyText>
            We ship worldwide where permitted. International customers are responsible for any duties, taxes, or customs
            fees levied by their country. These charges are not collected at checkout and are billed by the carrier or
            local customs authority upon arrival.
          </BodyText>
        </section>

        <button
          type="button"
          onClick={() => onNavigate('contact')}
          className="text-xs uppercase tracking-[0.15em] font-medium text-[#5d5f5f] hover:text-black hover:underline cursor-pointer"
        >
          Questions about an order? Contact us
        </button>
      </div>
    </InfoPageShell>
  );
};
