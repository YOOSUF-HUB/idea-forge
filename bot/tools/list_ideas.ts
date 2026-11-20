import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import { ideasKey, type IdeaList } from "../lib/ideas.js";

export default defineTool({
  description: prompt`
    List product ideas saved in this session, newest last.
    Use when the user asks what they have saved, or before comparing ideas.
  `,
  effect: "read",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const stored = (await ctx.host.kv.get(ideasKey(ctx.session.id))) as
      | IdeaList
      | undefined;
    const ideas = stored?.ideas ?? [];
    return {
      count: ideas.length,
      ideas: ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        audience: idea.audience,
        overall: idea.overall,
        scores: idea.scores,
        pitch: idea.pitch,
        savedAt: idea.savedAt,
      })),
    };
  },
});
