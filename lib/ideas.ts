/** Shared idea-store helpers. */

export type IdeaScores = {
  clarity: number;
  feasibility: number;
  novelty: number;
  demand: number;
};

export type SavedIdea = {
  id: string;
  title: string;
  pitch: string;
  audience: string;
  scores: IdeaScores;
  overall: number;
  savedAt: string;
};

export type IdeaList = {
  ideas: SavedIdea[];
};

export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "idea";
}

export function overallScore(scores: IdeaScores): number {
  const avg =
    (scores.clarity + scores.feasibility + scores.novelty + scores.demand) / 4;
  return Math.round(avg * 10) / 10;
}

export function clampScore(n: number): number {
  if (Number.isNaN(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n * 10) / 10));
}
