import React from 'react';
import { ViewScreen } from '../../types';
import { BodyText, InfoPageShell, SectionHeading } from './InfoPageShell';

interface ReturnsPageProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

export const ReturnsPage: React.FC<ReturnsPageProps> = ({ onNavigate }) => {
  return (
    <InfoPageShell
      eyebrow="Support"
      title="Returns & Exchanges"
      intro="We want every piece to feel considered. If a garment is not quite right, our returns studio will guide you through a simple, transparent process."
      onNavigate={onNavigate}
    >
      <div className="max-w-3xl space-y-12">
        <section>
          <SectionHeading>Return eligibility</SectionHeading>
          <BodyText>
            Unworn items purchased at full price or on sale may be returned, provided they meet the condition
            requirements below. Final-sale items marked as such at checkout are not eligible.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Return period</SectionHeading>
          <BodyText>
            You have 14 days from the delivery date to request a return or exchange. The request must be submitted
            through our concierge within that window. Parcels should be posted back within 7 days of receiving your
            return authorization.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Condition requirements</SectionHeading>
          <BodyText>
            Garments must be unused, unwashed, and in original condition, with all tags attached. Try-on is welcome;
            signs of wear, fragrance, deodorant, or alteration will void eligibility. Original packaging should be
            used where possible.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Non-returnable items</SectionHeading>
          <ul className="text-sm sm:text-base text-[#5d5f5f] font-light leading-relaxed list-disc pl-5 space-y-2">
            <li>Items marked Final Sale</li>
            <li>Gift cards</li>
            <li>Underwear, socks, and worn footwear</li>
            <li>Custom or made-to-measure pieces</li>
            <li>Items returned without tags or in unsellable condition</li>
          </ul>
        </section>

        <section>
          <SectionHeading>Exchange process</SectionHeading>
          <BodyText>
            Size or color exchanges are offered subject to availability. Request an exchange when you open your return.
            If the preferred size is unavailable, we will process a refund to the original payment method.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Refund process</SectionHeading>
          <BodyText>
            Once we receive and inspect your return, we issue a refund to the original payment method. Store credit may
            be offered if you prefer a faster credit for a future order. Original shipping fees are non-refundable
            unless the item arrived damaged or incorrect.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Refund processing time</SectionHeading>
          <BodyText>
            Inspection typically takes 3–5 business days after the parcel arrives at our returns studio. Banks may take
            an additional 5–10 business days to post the credit. You will receive an email when the refund is released.
          </BodyText>
        </section>

        <section>
          <SectionHeading>How to start a return</SectionHeading>
          <ol className="text-sm sm:text-base text-[#5d5f5f] font-light leading-relaxed list-decimal pl-5 space-y-2">
            <li>Open the Contact page and select “Returns & Exchanges” as the subject.</li>
            <li>Include your order number, the item(s) to return, and whether you prefer a refund or exchange.</li>
            <li>Wait for a return authorization and prepaid label (where available in your region).</li>
            <li>Pack the garment securely with tags attached and drop it with the designated carrier.</li>
          </ol>
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="mt-8 bg-black text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
          >
            Start a Return
          </button>
        </section>
      </div>
    </InfoPageShell>
  );
};
