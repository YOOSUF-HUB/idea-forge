import { z } from "zod";

const Score = z.number().min(1).max(5);

export const saveIdeaInputSchema = z.object({
  title: z.string().min(2).max(80).describe("Short product name."),
  pitch: z
    .string()
    .min(10)
    .max(500)
    .describe("One or two sentences: who it is for and what it does."),
  audience: z.string().min(2).max(120).describe("Primary user or buyer."),
  clarity: Score.describe("How clear the idea is (1–5)."),
  feasibility: Score.describe("How buildable as an MVP (1–5)."),
  novelty: Score.describe("How differentiated (1–5)."),
  demand: Score.describe("How believable the demand signal is (1–5)."),
});

export const getIdeaInputSchema = z.object({
  id: z.string().min(1).describe("Idea id from save_idea or list_ideas."),
});

export const ideaTools = {
  save_idea: {
    description:
      "Persist a product idea with 1–5 scores in the user's browser. Call after you score an idea the user wants to keep. Do not call for throwaway brainstorming unless the user asks to save.",
    inputSchema: saveIdeaInputSchema,
  },
  list_ideas: {
    description:
      "List product ideas saved in the user's browser, newest last. Use when the user asks what they have saved, or before comparing ideas.",
    inputSchema: z.object({}),
  },
  get_idea: {
    description:
      "Fetch one saved idea by id from the user's browser. Use before drafting an MVP plan for a saved idea.",
    inputSchema: getIdeaInputSchema,
  },
} as const;
