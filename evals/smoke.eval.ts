import { defineEval, includes } from "@grok/agent-sdk/evals";

export default defineEval({
  tags: ["smoke"],
  description: "Scores a concrete idea and saves it with save_idea.",
  async test(t) {
    await t.send(
      [
        "I have a product idea: a weekly email that summarizes my team's",
        "Linear tickets into a plain-English status update for executives.",
        "Audience is eng managers at 20–200 person startups.",
        "Please score it and save it.",
      ].join(" "),
    );
    t.succeeded();
    t.calledTool("save_idea");
    t.check(t.reply, includes(/feasib|score|mvp|audience|clarity/i));
  },
});
