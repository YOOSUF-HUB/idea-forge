"use client";

import {
  clampScore,
  overallScore,
  slugifyTitle,
  type IdeaList,
  type SavedIdea,
} from "./ideas";

export const IDEAS_STORAGE_KEY = "idea-forge:ideas";

export function loadIdeas(): SavedIdea[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(IDEAS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IdeaList;
    return Array.isArray(parsed.ideas) ? parsed.ideas : [];
  } catch {
    return [];
  }
}

export function persistIdeas(ideas: SavedIdea[]): void {
  if (typeof window === "undefined") return;
  const payload: IdeaList = { ideas };
  window.localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(payload));
}

export type SaveIdeaInput = {
  title: string;
  pitch: string;
  audience: string;
  clarity: number;
  feasibility: number;
  novelty: number;
  demand: number;
};

export function saveIdea(input: SaveIdeaInput): {
  saved: true;
  id: string;
  overall: number;
  totalIdeas: number;
  idea: SavedIdea;
} {
  const scores = {
    clarity: clampScore(input.clarity),
    feasibility: clampScore(input.feasibility),
    novelty: clampScore(input.novelty),
    demand: clampScore(input.demand),
  };
  const idea: SavedIdea = {
    id: `${slugifyTitle(input.title)}-${Date.now().toString(36)}`,
    title: input.title.trim(),
    pitch: input.pitch.trim(),
    audience: input.audience.trim(),
    scores,
    overall: overallScore(scores),
    savedAt: new Date().toISOString(),
  };
  const ideas = [...loadIdeas(), idea];
  persistIdeas(ideas);
  return {
    saved: true,
    id: idea.id,
    overall: idea.overall,
    totalIdeas: ideas.length,
    idea,
  };
}

export function listIdeas(): {
  count: number;
  ideas: SavedIdea[];
} {
  const ideas = loadIdeas();
  return { count: ideas.length, ideas };
}

export function getIdea(id: string):
  | { found: true; idea: SavedIdea }
  | { found: false; id: string } {
  const idea = loadIdeas().find((item) => item.id === id);
  if (!idea) return { found: false, id };
  return { found: true, idea };
}

export function clearIdeas(): void {
  persistIdeas([]);
}
