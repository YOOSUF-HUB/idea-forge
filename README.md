# Idea Forge

An agentic product coach built with the [Cursor Agent SDK](https://cursor.com/docs/bdk). Describe a product idea; Idea Forge scores it, saves it for the session, and can draft a tight MVP plan.

This project is a small end-to-end demo of Cursor building and running an agent: tools, skills, durable session memory, evals, and a local playground.

## What it does

- Scores ideas on clarity, feasibility, novelty, and demand (1–5)
- Saves and lists ideas for the current chat session
- Drafts MVP plans with scope cuts, risks, and next moves

## Prerequisites

- Node.js 22.13+
- A Cursor account / API key for model turns (`npx @grok/agent-sdk login`)

## Run locally

```bash
npm install
npx @grok/agent-sdk login   # once, if you are not signed in
npm run dev                 # playground + API (default port 3000)
```

Open the playground URL printed in the terminal (usually `http://127.0.0.1:<port>/playground`).

Try prompts like:

- "Score and save this idea: a shared inbox for landlord maintenance requests."
- "List my saved ideas."
- "Draft an MVP plan for the strongest one."

One-shot turn without the playground:

```bash
npx @grok/agent-sdk run --dir . --message "Score and save: a chrome extension that turns meeting notes into Linear tickets."
```

## Checks

```bash
npx @grok/agent-sdk validate --dir .
npm run check
npx @grok/agent-sdk tool call save_idea --dir . --input '{"title":"Desk Queue","pitch":"A waitlist for shared desks in coworking spaces.","audience":"coworking operators","clarity":4,"feasibility":4,"novelty":3,"demand":3}'
npx @grok/agent-sdk eval --dir . --list
npx @grok/agent-sdk eval --dir .   # needs a Cursor credential
```

## Deploy

Do not deploy from a cloud agent transcript if you need the one-time alias token. On your machine:

```bash
npx @grok/agent-sdk validate --dir .
npx @grok/agent-sdk deploy --dir . --dry-run
npx @grok/agent-sdk deploy --dir .
```

Manage hosted agents at https://cursor.com/dashboard/deployed-agents.

## Layout

| Path | Role |
| --- | --- |
| `bot/agent.ts` | Model config |
| `bot/instructions.md` | Always-on system prompt |
| `bot/tools/` | `save_idea`, `list_ideas`, `get_idea` |
| `bot/skills/mvp-plan.md` | Scoring + MVP reply shape |
| `evals/smoke.eval.ts` | Smoke eval |
