# Idea Forge

Product coach that scores ideas and drafts tight MVP plans. Built with **Next.js**, **Groq**, and browser **localStorage** — deployable on **Vercel**.

## What it does

- Scores ideas on clarity, feasibility, novelty, and demand (1–5)
- Saves and lists ideas in your browser only
- Drafts MVP plans with scope cuts, risks, and next moves

## Prerequisites

- Node.js 22+
- A Groq API key from [console.groq.com/keys](https://console.groq.com/keys)

## Run locally

```bash
cd idea-forge
npm install
cp .env.example .env.local
# paste GROQ_API_KEY into .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Try prompts like:

- "Score and save: a Slack bot that turns messy standups into a daily digest."
- "List my saved ideas."
- "Draft an MVP plan for the strongest one."

## Deploy on Vercel

1. Import this folder as a Vercel project (root directory: `idea-forge` if the repo parent is `IDEA-FORGE`).
2. Set environment variable `GROQ_API_KEY`.
3. Deploy.

```bash
npx vercel
```

## Notes

- Ideas never leave the browser; clearing site data removes them.
- Model: `llama-3.3-70b-versatile` via Groq (tool-calling capable).
