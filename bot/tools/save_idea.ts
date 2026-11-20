import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import {
  clampScore,
  ideasKey,
  overallScore,
  slugifyTitle,
  type IdeaList,
  type SavedIdea,
} from "../lib/ideas.js";

const Score = z.number().min(1).max(5);

export default defineTool({
  description: prompt`
    Persist a product idea with your 1–5 scores for this session.
    Call after you score an idea the user wants to keep.
    Do not call for throwaway brainstorming unless the user asks to save.
  `,
  effect: "write",
  inputSchema: z.object({
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
  }),
  dryRunResult: ({ title }) => ({
    saved: false,
    dryRun: true,
    id: slugifyTitle(title),
  }),
  async execute(input, ctx) {
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

    const key = ideasKey(ctx.session.id);
    const prior = (await ctx.host.kv.get(key)) as IdeaList | undefined;
    const ideas = [...(prior?.ideas ?? []), idea];
    await ctx.host.kv.put(key, { ideas });

    return {
      saved: true,
      id: idea.id,
      overall: idea.overall,
      totalIdeas: ideas.length,
    };
  },
});
