import React from 'react';
import { ViewScreen } from '../../types';
import { BodyText, InfoPageShell, SectionHeading } from './InfoPageShell';

interface PrivacyPageProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  return (
    <InfoPageShell
      eyebrow="Company"
      title="Privacy Policy"
      intro="This policy explains how ZAYRO Store collects, uses, and protects personal information when you visit our website, place an order, or contact our concierge. Last updated: August 2026."
      onNavigate={onNavigate}
    >
      <div className="max-w-3xl space-y-12">
        <section>
          <SectionHeading>Information we collect</SectionHeading>
          <BodyText className="mb-3">
            We may collect information you provide directly, including name, email address, phone number, shipping and
            billing addresses, order details, and messages sent through our contact form.
          </BodyText>
          <BodyText>
            We may also collect technical data automatically, such as browser type, device information, approximate
            location, pages viewed, and referring URLs, to operate and improve the site.
          </BodyText>
        </section>

        <section>
          <SectionHeading>How we use information</SectionHeading>
          <BodyText>
            We use personal information to process orders, provide customer support, send transactional emails (order
            confirmation, shipping, returns), improve our products and website, prevent fraud, and — where you have
            opted in — share collection updates. We do not sell your personal information.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Cookies</SectionHeading>
          <BodyText>
            We use cookies and similar technologies to keep your shopping bag, remember preferences, and understand how
            the site is used. You may control cookies through your browser settings. Disabling certain cookies may
            affect checkout or saved-bag functionality.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Payments</SectionHeading>
          <BodyText>
            Payments are processed by trusted third-party payment providers. ZAYRO does not store full card numbers on
            our servers. Card data is handled according to the provider’s security standards and applicable card-network
            rules.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Data security</SectionHeading>
          <BodyText>
            We apply administrative, technical, and organizational measures designed to protect personal information
            against unauthorized access, alteration, or loss. No method of transmission over the internet is completely
            secure; we encourage you to use a unique password and a secure connection when shopping.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Third-party services</SectionHeading>
          <BodyText>
            We may share information with service providers who help us operate the business — for example shipping
            carriers, payment processors, email delivery, analytics, and hosting. These parties are permitted to use
            your information only to perform services on our behalf, subject to confidentiality obligations.
          </BodyText>
        </section>

        <section>
          <SectionHeading>User rights</SectionHeading>
          <BodyText>
            Depending on your location, you may have the right to request access to, correction of, or deletion of
            personal information we hold, or to object to certain processing. To exercise these rights, contact us using
            the details below. We may need to verify your identity before fulfilling a request.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Contact information</SectionHeading>
          <BodyText className="mb-4">
            For privacy questions or requests, write to privacy@zayrocollection.com or use our Contact page. Postal
            correspondence may be sent to ZAYRO Store, 740 Park Avenue, Suite 14, New York, NY 10021, United
            States.
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
