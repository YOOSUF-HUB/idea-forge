import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  name: "Idea Forge",
  description:
    "Scores product ideas, saves them for the session, and drafts tight MVP plans.",
  model: {
    id: "grok-4.7",
    params: [
      { id: "reasoning_effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
});
