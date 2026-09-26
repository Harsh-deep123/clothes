import React from 'react';
import { ViewScreen } from '../../types';
import { BodyText, InfoPageShell, SectionHeading } from './InfoPageShell';

interface StoryPageProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

export const StoryPage: React.FC<StoryPageProps> = ({ onNavigate }) => {
  return (
    <InfoPageShell
      eyebrow="Company"
      title="THE STORY OF ZAYRO"
      intro="ZAYRO began as a question of proportion: how should a modern man occupy space? The answer became a collection — editorial, architectural, and built to last beyond a season."
      onNavigate={onNavigate}
    >
      <div className="max-w-3xl space-y-16 md:space-y-20">
        <section>
          <SectionHeading>The Beginning</SectionHeading>
          <BodyText>
            The house was founded with a small edit of tailoring and heavyweight knits, developed in close conversation
            with pattern-makers who understood structure as a form of ease. Early pieces were tested in real rooms —
            studios, streets, and long travel days — until the fit felt inevitable rather than imposed.
          </BodyText>
        </section>

        <section>
          <SectionHeading>The Inspiration</SectionHeading>
          <BodyText>
            Inspiration sits at the intersection of gallery and wardrobe. We look to brutalist lines, archival menswear
            photography, and the quiet discipline of uniforms done well. Color is held back so silhouette can speak.
            Texture does the work that logos once did.
          </BodyText>
        </section>

        <section>
          <SectionHeading>The Vision</SectionHeading>
          <BodyText>
            ZAYRO exists to make precision feel personal. We believe clothing should clarify identity, not compete with
            it. Each drop is an editorial series: considered fabrics, architectural cuts, and a refusal to overproduce.
            The collection is meant to be worn hard and photographed well.
          </BodyText>
        </section>

        <section>
          <SectionHeading>The Future</SectionHeading>
          <BodyText>
            Ahead, we continue to refine rather than expand for its own sake — deeper fabric development, more exacting
            fits, and a client experience that matches the clothes. The standard remains the same: if it does not
            elevate how you carry yourself, it does not ship.
          </BodyText>
        </section>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => onNavigate('new-arrivals')}
            className="bg-black text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
          >
            Explore the Collection
          </button>
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className="bg-transparent border border-black text-black text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-black hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            About ZAYRO
          </button>
        </div>
      </div>
    </InfoPageShell>
  );
};
