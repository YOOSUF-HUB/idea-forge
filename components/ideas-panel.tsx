"use client";

import type { SavedIdea } from "@/lib/ideas";

type IdeasPanelProps = {
  ideas: SavedIdea[];
  onClear: () => void;
  onAskAbout: (idea: SavedIdea) => void;
};

export function IdeasPanel({ ideas, onClear, onAskAbout }: IdeasPanelProps) {
  return (
    <aside className="ideas-panel" aria-label="Saved ideas">
      <div className="ideas-panel__head">
        <h2>Saved ideas</h2>
        {ideas.length > 0 ? (
          <button type="button" className="ghost-btn" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>

      {ideas.length === 0 ? (
        <p className="ideas-panel__empty">
          Nothing saved yet. Score an idea in chat and it lands here — only in
          this browser.
        </p>
      ) : (
        <ul className="ideas-list">
          {[...ideas].reverse().map((idea) => (
            <li key={idea.id}>
              <button
                type="button"
                className="idea-card"
                onClick={() => onAskAbout(idea)}
              >
                <div className="idea-card__top">
                  <span className="idea-card__title">{idea.title}</span>
                  <span className="idea-card__score" title="Overall score">
                    {idea.overall.toFixed(1)}
                  </span>
                </div>
                <p className="idea-card__pitch">{idea.pitch}</p>
                <div className="idea-card__meters" aria-hidden>
                  <Meter label="C" value={idea.scores.clarity} />
                  <Meter label="F" value={idea.scores.feasibility} />
                  <Meter label="N" value={idea.scores.novelty} />
                  <Meter label="D" value={idea.scores.demand} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div className="meter">
      <span>{label}</span>
      <span className="meter__track">
        <span className="meter__fill" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
