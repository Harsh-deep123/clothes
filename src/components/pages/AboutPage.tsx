import React from 'react';
import { ViewScreen } from '../../types';
import { BodyText, InfoPageShell, SectionHeading } from './InfoPageShell';

interface AboutPageProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <InfoPageShell
      eyebrow="Company"
      title="MORE THAN CLOTHING. IT'S YOUR IDENTITY."
      intro="ZAYRO Store is a modern menswear house built on confidence, individuality, and uncompromising quality. We design for men who treat clothing as architecture — structured, considered, and lived in."
      onNavigate={onNavigate}
    >
      <div className="max-w-3xl space-y-14">
        <section>
          <SectionHeading>Our Mission</SectionHeading>
          <BodyText>
            To create contemporary wardrobe essentials that feel as precise as they look. Every ZAYRO piece is intended
            to sharpen how you move through the day — not to costume you for a moment. We cut with intention, finish
            with discipline, and edit relentlessly so that what remains earns a permanent place in your rotation.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Our Vision</SectionHeading>
          <BodyText>
            A quieter kind of luxury: fewer logos, stronger silhouettes, materials chosen for how they age. We see a
            future where menswear is both architectural and effortless — garments that hold their line, yet never
            restrict the life you actually live.
          </BodyText>
        </section>

        <section>
          <SectionHeading>Quality & Design</SectionHeading>
          <BodyText>
            From heavyweight cottons to Italian merino and structured tailoring, we specify fabrics for hand, drape, and
            durability. Patterns are developed for modern proportions — broader shoulders, cleaner waist suppression,
            considered length. Details are kept essential: a precise seam, a considered pocket, a finish you notice
            only when you look twice.
          </BodyText>
        </section>

        <section>
          <SectionHeading>The ZAYRO Lifestyle</SectionHeading>
          <BodyText>
            ZAYRO is for the man who builds his presence through consistency. City mornings, late studios, travel days,
            evenings that run long. Our collection is designed as a system: jackets that layer over tees, trousers that
            hold a crease, shirts that work at a table or on the move. Comfort is not an afterthought. It is the
            condition of confidence.
          </BodyText>
        </section>

        <button
          type="button"
          onClick={() => onNavigate('story')}
          className="bg-black text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
        >
          Read Our Story
        </button>
      </div>
    </InfoPageShell>
  );
};
