import React from 'react';

export type CurtainPhase = 'idle' | 'closing' | 'opening';

const LEFT_FOLDS = 7;
const RIGHT_FOLDS = 7;

interface PageCurtainProps {
  phase: CurtainPhase;
}

export const PageCurtain: React.FC<PageCurtainProps> = ({ phase }) => {
  if (phase === 'idle') return null;

  return (
    <div
      className={`zayro-curtain ${phase === 'closing' ? 'is-closing' : 'is-opening'}`}
      aria-hidden="true"
    >
      <div className="zayro-curtain-stage">
        <div className="zayro-curtain-half zayro-curtain-left">
          {Array.from({ length: LEFT_FOLDS }, (_, index) => (
            <span
              key={`l-${index}`}
              className="zayro-curtain-fold"
              style={{ '--fold-i': index, '--fold-n': LEFT_FOLDS - 1 } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="zayro-curtain-half zayro-curtain-right">
          {Array.from({ length: RIGHT_FOLDS }, (_, index) => (
            <span
              key={`r-${index}`}
              className="zayro-curtain-fold"
              style={{ '--fold-i': index, '--fold-n': RIGHT_FOLDS - 1 } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="zayro-curtain-sheen" />
        <div className="zayro-curtain-glow" />
      </div>
    </div>
  );
};
