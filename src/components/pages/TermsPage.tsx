import React from 'react';
import { ViewScreen } from '../../types';
import { BodyText, InfoPageShell, SectionHeading } from './InfoPageShell';

interface TermsPageProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <InfoPageShell
      eyebrow="Company"
      title="Terms & Conditions"
      intro="These terms govern your use of the ZAYRO Store website and any orders placed through it. Last updated: August 2026."
      onNavigate={onNavigate}
    >
      <div className="max-w-3xl space-y-12">
        <section>
          <SectionHeading>Acceptance of Terms</SectionHeading>
          <BodyText>
            By accessing this website or placing an order, you agree to these Terms & Conditions and our Privacy Policy.
            If you do not agree, please discontinue use of the site.
          </BodyText>
        </section>
        <section>
          <SectionHeading>Website Usage</SectionHeading>
          <BodyText>
            You may use the site for lawful personal shopping only. You agree not to misuse the service, attempt
            unauthorized access, or copy content for commercial purposes without written consent.
          </BodyText>
        </section>
        <section>
          <SectionHeading>Products and Pricing</SectionHeading>
          <BodyText>
            We aim to display products and prices accurately. Colors may vary by screen. We may correct errors, update
            pricing, or withdraw items at any time. Promotional pricing is valid only for the stated period.
          </BodyText>
        </section>
        <section>
          <SectionHeading>Orders</SectionHeading>
          <BodyText>
            An order is an offer to purchase. We may accept or decline an order, including where an item is out of stock
            or information appears incomplete. You will receive confirmation when an order is recorded.
          </BodyText>
        </section>
        <section>
          <SectionHeading>Payments</SectionHeading>
          <BodyText>
            Live payment processing is not currently connected to this storefront. Orders placed here are stored locally
            on your device for demonstration of the checkout flow. When a processor is connected, payment will be taken
            by that provider under their terms. We do not claim that card charges are processed until that integration
            exists.
          </BodyText>
        </section>
        <section>
          <SectionHeading>Shipping</SectionHeading>
          <BodyText>
            Delivery estimates are described on the Shipping page. Risk of loss passes to you upon delivery to the
            address provided, except where required otherwise by law. You are responsible for providing a complete and
            accurate address.
          </BodyText>
        </section>
        <section>
          <SectionHeading>Returns and Refunds</SectionHeading>
          <BodyText>
            Returns follow the policy on our Returns page, including eligibility, time limits, and condition
            requirements. Refunds, when due, are issued to the original payment method once a live processor is in use,
            or noted on the local order record in this demonstration.
          </BodyText>
        </section>
        <section>
          <SectionHeading>Intellectual Property</SectionHeading>
          <BodyText>
            All trademarks, product names, imagery, and site design associated with ZAYRO Store remain our property
            or that of our licensors. You may not reproduce or distribute this material without permission.
          </BodyText>
        </section>
        <section>
          <SectionHeading>Limitation of Liability</SectionHeading>
          <BodyText>
            To the fullest extent permitted by law, ZAYRO Store is not liable for indirect, incidental, or
            consequential damages arising from use of the site or products, including delays caused by carriers. Nothing
            in these terms excludes liability that cannot be excluded by law.
          </BodyText>
        </section>
        <section>
          <SectionHeading>Changes to Terms</SectionHeading>
          <BodyText>
            We may update these terms from time to time. The “Last updated” date will change accordingly. Continued use
            of the site after updates constitutes acceptance of the revised terms.
          </BodyText>
        </section>
        <section>
          <SectionHeading>Contact Information</SectionHeading>
          <BodyText className="mb-4">
            Questions about these terms may be sent to legal@zayrocollection.com or through our Contact page. Postal
            correspondence: ZAYRO Store, 740 Park Avenue, Suite 14, New York, NY 10021, United States.
          </BodyText>
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="text-xs uppercase tracking-[0.15em] font-medium text-[#5d5f5f] hover:text-black hover:underline cursor-pointer"
          >
            Go to Contact
          </button>
        </section>
      </div>
    </InfoPageShell>
  );
};
