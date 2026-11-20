import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import { ideasKey, type IdeaList } from "../lib/ideas.js";

export default defineTool({
  description: prompt`
    Fetch one saved idea by id from this session.
    Use before drafting an MVP plan for a saved idea.
  `,
  effect: "read",
  inputSchema: z.object({
    id: z.string().min(1).describe("Idea id from save_idea or list_ideas."),
  }),
  async execute({ id }, ctx) {
    const stored = (await ctx.host.kv.get(ideasKey(ctx.session.id))) as
      | IdeaList
      | undefined;
    const idea = stored?.ideas.find((item) => item.id === id);
    if (!idea) {
      return { found: false as const, id };
    }
    return { found: true as const, idea };
  },
});
