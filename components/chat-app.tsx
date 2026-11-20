"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { IdeasPanel } from "@/components/ideas-panel";
import type { SavedIdea } from "@/lib/ideas";
import {
  clearIdeas,
  getIdea,
  listIdeas,
  loadIdeas,
  saveIdea,
  type SaveIdeaInput,
} from "@/lib/storage";

const STARTERS = [
  "Score and save: a Slack bot that turns messy standups into a one-page daily digest.",
  "Score this: a browser tool that blocks doomscroll sites after 10 minutes unless I write why I still need them.",
  "Draft an MVP for a WhatsApp assistant that books clinic follow-ups from voice notes.",
];

export function ChatApp() {
  const [input, setInput] = useState("");
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);

  const refreshIdeas = useCallback(() => {
    setIdeas(loadIdeas());
  }, []);

  useEffect(() => {
    refreshIdeas();
  }, [refreshIdeas]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    [],
  );

  const { messages, sendMessage, addToolOutput, status, error, stop } =
    useChat({
      transport,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      async onToolCall({ toolCall }) {
        if (toolCall.dynamic) return;

        try {
          if (toolCall.toolName === "save_idea") {
            const input = toolCall.input as SaveIdeaInput;
            const result = saveIdea(input);
            refreshIdeas();
            addToolOutput({
              tool: "save_idea",
              toolCallId: toolCall.toolCallId,
              output: {
                saved: result.saved,
                id: result.id,
                overall: result.overall,
                totalIdeas: result.totalIdeas,
              },
            });
            return;
          }

          if (toolCall.toolName === "list_ideas") {
            const result = listIdeas();
            addToolOutput({
              tool: "list_ideas",
              toolCallId: toolCall.toolCallId,
              output: result,
            });
            return;
          }

          if (toolCall.toolName === "get_idea") {
            const { id } = toolCall.input as { id: string };
            addToolOutput({
              tool: "get_idea",
              toolCallId: toolCall.toolCallId,
              output: getIdea(id),
            });
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Tool execution failed";
          addToolOutput({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText: message,
          });
        }
      },
    });

  const busy = status === "submitted" || status === "streaming";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage({ text });
  }

  function askStarter(text: string) {
    if (busy) return;
    void sendMessage({ text });
  }

  function onAskAbout(idea: SavedIdea) {
    if (busy) return;
    void sendMessage({
      text: `Draft an MVP plan for "${idea.title}" (id: ${idea.id}). Use get_idea first.`,
    });
  }

  function onClearIdeas() {
    clearIdeas();
    refreshIdeas();
  }

  return (
    <div className="shell">
      <header className="brand-bar">
        <div className="brand-mark" aria-hidden />
        <div>
          <p className="brand-name">Idea Forge</p>
          <p className="brand-tag">Stress-test ideas before you build</p>
        </div>
      </header>

      <div className="workspace">
        <section className="chat-pane" aria-label="Coach chat">
          <div className="message-scroll">
            {messages.length === 0 ? (
              <div className="welcome">
                <h1>Heat-check the idea.</h1>
                <p>
                  Describe a product. Idea Forge scores clarity, feasibility,
                  novelty, and demand — then can draft a tight MVP slice.
                </p>
                <div className="starters">
                  {STARTERS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="starter"
                      onClick={() => askStarter(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`bubble bubble--${message.role}`}
                >
                  <span className="bubble__role">
                    {message.role === "user" ? "You" : "Forge"}
                  </span>
                  <div className="bubble__body">
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <p key={`${message.id}-t-${index}`}>{part.text}</p>
                        );
                      }

                      if (part.type === "tool-save_idea") {
                        return (
                          <ToolChip
                            key={`${message.id}-save-${index}`}
                            label={
                              part.state === "output-available"
                                ? `Saved · ${(part.output as { id?: string })?.id ?? "idea"}`
                                : "Saving idea…"
                            }
                          />
                        );
                      }

                      if (part.type === "tool-list_ideas") {
                        return (
                          <ToolChip
                            key={`${message.id}-list-${index}`}
                            label={
                              part.state === "output-available"
                                ? `Listed ${(part.output as { count?: number })?.count ?? 0} ideas`
                                : "Listing ideas…"
                            }
                          />
                        );
                      }

                      if (part.type === "tool-get_idea") {
                        return (
                          <ToolChip
                            key={`${message.id}-get-${index}`}
                            label={
                              part.state === "output-available"
                                ? "Fetched idea"
                                : "Fetching idea…"
                            }
                          />
                        );
                      }

                      return null;
                    })}
                  </div>
                </article>
              ))
            )}
          </div>

          {error ? (
            <p className="error-banner" role="alert">
              {error.message}
            </p>
          ) : null}

          <form className="composer" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="prompt">
              Message
            </label>
            <textarea
              id="prompt"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pitch an idea, ask for scores, or request an MVP plan…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
            />
            <div className="composer__actions">
              {busy ? (
                <button type="button" className="ghost-btn" onClick={stop}>
                  Stop
                </button>
              ) : null}
              <button type="submit" className="send-btn" disabled={busy || !input.trim()}>
                {busy ? "Forging…" : "Send"}
              </button>
            </div>
          </form>
        </section>

        <IdeasPanel
          ideas={ideas}
          onClear={onClearIdeas}
          onAskAbout={onAskAbout}
        />
      </div>
    </div>
  );
}

function ToolChip({ label }: { label: string }) {
  return <span className="tool-chip">{label}</span>;
}
