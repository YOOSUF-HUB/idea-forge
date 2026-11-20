import { createGroq } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { ideaTools } from "@/lib/tools";

export const maxDuration = 60;

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: "Missing GROQ_API_KEY. Add it to .env.local or Vercel env." },
      { status: 500 },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: groq("openai/gpt-oss-120b"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: ideaTools,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
