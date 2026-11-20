# Idea Forge

Idea Forge is a product-coaching workspace for founders, PMs, and early teams who need a structured pass on an idea before they spend engineering time on it. Describe a product in plain language. The coach scores it, keeps the card in the browser, and turns a chosen idea into a constrained MVP plan.

It is a Next.js application designed for Vercel. Inference runs on Groq. Idea records never leave the browser.

## Why it exists

Most idea conversations stall in one of two places: vague enthusiasm, or a document that is too long to act on. Idea Forge forces a short decision loop.

| Stage | What the user gets | Why it matters commercially |
| --- | --- | --- |
| Intake | One clarifying question when the buyer, job, or timing is missing | Stops teams from scoring a slogan |
| Score | Four 1–5 scores plus an overall | Makes weak spots comparable across ideas |
| Keep | A local idea card the coach can fetch later | Turns a chat into a working shortlist |
| Plan | A tight MVP: slice, out-of-scope, risks, next moves | Converts the shortlist into a build decision |

The product is opinionated on purpose. Scores are candid. A 3 means “plausible, needs proof.” A 5 is reserved for unusually strong evidence. The coach does not invent user research, metrics, or competitor facts.

## Who it is for

- Founders comparing two or three bets before committing a sprint
- Product managers who need a first-cut MVP boundary, not a strategy deck
- Studios and internal innovation groups that want a repeatable scoring rubric

It is a single-user workspace. There is no account system, no shared workspace, and no server-side idea store.

## Product behavior

The coach follows a fixed operating model, encoded in `lib/prompts.ts`.

1. Ask only for missing essentials: who it is for, what it does, and why now.
2. Score every serious idea on **clarity**, **feasibility**, **novelty**, and **demand** (1–5).
3. Persist the idea with `save_idea` when the user wants to keep it, or after scoring one they clearly intend to pursue.
4. Load prior cards with `list_ideas` or `get_idea` before comparison or planning.
5. For a build plan, reply in a fixed shape: name and one-liner, who, MVP slice (3–5 features), out of scope, two risks, and the next three moves. Default length is about 25 lines.

### Scoring rubric

| Dimension | Question it answers |
| --- | --- |
| Clarity | Can a stranger understand the product in one sentence? |
| Feasibility | Can a small team ship a useful first version without exotic infrastructure? |
| Novelty | Is there a sharp wedge versus the obvious alternatives? |
| Demand | Is there a believable buyer, pain, or distribution path? |

Overall is the arithmetic mean of the four scores, rounded to one decimal.

### Idea record

Each saved card is a JSON object:

```ts
type SavedIdea = {
  id: string;          // slug + base36 timestamp
  title: string;
  pitch: string;
  audience: string;
  scores: {
    clarity: number;
    feasibility: number;
    novelty: number;
    demand: number;
  };
  overall: number;
  savedAt: string;     // ISO-8601
};
```

Storage key: `idea-forge:ideas` in `localStorage`. Clearing site data deletes the shortlist. There is no sync across devices.

## Architecture

The model never writes to disk or a database. Tool schemas live on the server so the model can call them. Tool execution runs in the browser so the API key and the idea store stay on opposite sides of the trust boundary.

```text
Browser                         Vercel                         Groq
───────                         ──────                         ────
Chat UI (useChat)
  │  UI messages
  ├──────────────────────────►  POST /api/chat
  │                             streamText + tool schemas
  │                             GROQ_API_KEY stays here  ───►  openai/gpt-oss-120b
  │  streamed assistant + tool calls  ◄───────────────────────
  │
  ├─ save_idea / list_ideas / get_idea
  │     executed in onToolCall
  │     read/write localStorage
  │
  └─ tool outputs resubmitted automatically
        until the model finishes the turn
```

Request path:

1. The client sends the UI message history to `app/api/chat/route.ts`.
2. The route converts messages with `convertToModelMessages` and calls `streamText` through `@ai-sdk/groq`.
3. Tools are declared without an `execute` function, so the AI SDK forwards tool calls to the client instead of running them on the server.
4. `useChat` handles each call in `onToolCall`, writes or reads `localStorage`, and returns the result with `addToolOutput`.
5. `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` continues the turn until the model produces a final reply.
6. The response is streamed back as a UI message stream (`maxDuration` 60 seconds).

### Trust and data boundaries

| Data | Where it lives | Exposure |
| --- | --- | --- |
| `GROQ_API_KEY` | Server env only (`.env.local` / Vercel) | Never sent to the browser |
| Chat transcript | In-memory React state for the open tab | Sent to `/api/chat`, then to Groq, as the model context |
| Saved ideas | `localStorage` on that browser | Returned to the model only when a tool result includes them |
| System prompt and tool schemas | Bundled server code | Not user-editable at runtime |

This is the right shape for a public demo and for a first commercial deployment that does not want to operate a customer database. It is the wrong shape if the product later needs accounts, shared shortlists, audit logs, or recovery after the user clears the browser.

## Technical stack

| Layer | Choice | Role |
| --- | --- | --- |
| App framework | Next.js 15 App Router | UI, route handlers, Vercel runtime |
| UI | React 19 | Chat thread, composer, idea panel |
| Model SDK | Vercel AI SDK 7 (`ai`, `@ai-sdk/react`) | Streaming chat, tool-call loop |
| Provider | `@ai-sdk/groq` | OpenAI-compatible Groq client |
| Model | `openai/gpt-oss-120b` | Tool-calling chat model |
| Validation | Zod 4 | Tool input schemas |
| Styling | Tailwind CSS 4 | Tokens in `app/globals.css` |
| Language | TypeScript | App, tools, and storage helpers |

Node.js 22 or newer is the supported local runtime.

## Repository layout

```text
idea-forge/
├── app/
│   ├── api/chat/route.ts     # Groq stream + tool schemas
│   ├── layout.tsx            # Fonts and metadata
│   ├── page.tsx              # Mounts the client workspace
│   └── globals.css           # Visual system
├── components/
│   ├── chat-app.tsx          # useChat, tool loop, composer
│   └── ideas-panel.tsx       # localStorage shortlist
├── lib/
│   ├── ideas.ts              # Types, slug, score math
│   ├── storage.ts            # localStorage CRUD
│   ├── tools.ts              # Zod tool contracts
│   └── prompts.ts            # Coach instructions + MVP skill
├── .env.example
└── package.json
```

`lib/ideas.ts` is the domain module. `lib/storage.ts` is the only persistence adapter. Swapping browser storage for a database later means replacing that adapter and moving tool `execute` onto the server. The prompt and score math do not need to change.

## Tools

| Tool | Effect | Contract |
| --- | --- | --- |
| `save_idea` | Append one card | `title`, `pitch`, `audience`, four scores in `[1, 5]` |
| `list_ideas` | Return the full list, oldest first | No arguments |
| `get_idea` | Fetch one card by id | `id` |

Scores are clamped and rounded before write. The returned tool payload to the model omits nothing the coach needs to compare or plan: id, pitch, audience, scores, overall, and timestamp.

## Local development

```bash
cd idea-forge
npm install
cp .env.example .env.local
```

Set `GROQ_API_KEY` in `.env.local`. Keys are created at [console.groq.com/keys](https://console.groq.com/keys).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run lint
npm run build
```

Example prompts that exercise the full loop:

- Score and save a concrete product with a named audience.
- List saved ideas.
- Draft an MVP plan for one saved card and name the decisive risk.

## Deployment

The app is a standard Next.js project. Vercel needs no adapter.

1. Import the repository. If the Git root is the parent `IDEA-FORGE` folder, set the Vercel root directory to `idea-forge`.
2. Add `GROQ_API_KEY` as a production environment variable.
3. Deploy. The chat route is a dynamic function (`ƒ /api/chat`). The page is static.

CLI equivalent from this directory:

```bash
npx vercel
```

Set the same environment variable in the Vercel project before the first production traffic. A missing key returns HTTP 500 with `Missing GROQ_API_KEY` and does not call Groq.

## Operating limits

- One browser, one shortlist. No multi-device continuity.
- No authentication. Anyone who can open the deployment can spend Groq tokens.
- Chat history is not durable. A reload starts a new thread; saved cards remain.
- The model can be wrong. Scores are judgments, and the prompt forbids fabricated evidence, but it does not ground answers in a research corpus.
- Function duration is capped at 60 seconds per request. Long tool loops are multiple requests, not one unbounded job.
- Commercial use of the model is also bounded by Groq’s terms for `openai/gpt-oss-120b`.

## Extending it

Natural next boundaries, in the order they change the architecture:

1. **Gate the deployment.** Add auth or a shared secret in front of `/api/chat` before exposing it publicly.
2. **Move persistence server-side.** Implement `execute` on the tools and store cards in a database keyed by user id. The Zod contracts in `lib/tools.ts` can stay.
3. **Swap the model.** Change the model id in `app/api/chat/route.ts`. Keep a tool-capable Groq model.
4. **Add a second surface.** Slack or email should call the same prompt and tool contracts rather than a second copy of the coach rules.
