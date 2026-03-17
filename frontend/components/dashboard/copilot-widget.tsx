"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  Loader2,
  SendHorizonal,
  X,
  MessageCircleMore,
  Sparkles,
} from "lucide-react";
import { copilotApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const STORAGE_KEY = "copilot_chat";

const STARTER_PROMPTS = [
  "Where am I overspending?",
  "How can I save more this month?",
  "What is my EMI burden?",
  "Which category is highest right now?",
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    text: "Hi, I’m Finsight AI Copilot. Ask me anything about your spending, budget, savings, EMI, or investments.",
  },
];

export function CopilotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load saved chat once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore invalid storage
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save chat whenever messages change, but only after hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage write failures
    }
  }, [messages, hydrated]);

  async function sendMessage(messageText?: string) {
    const text = (messageText ?? input).trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", text },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await copilotApi.chat(text);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          text: res.reply || "I couldn't generate a response right now.",
        },
      ]);
    } catch (err: unknown) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          text:
            err instanceof Error
              ? err.message
              : "Finsight AI Copilot is unavailable right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([
      {
        role: "assistant",
        text: "Chat cleared. Ask me anything about your spending, budget, savings, EMI, or investments.",
      },
    ]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage delete failures
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.03]",
          "md:bottom-6 md:right-6"
        )}
        aria-label="Open AI Copilot"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircleMore className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div
          className={cn(
            "fixed z-50 border border-border bg-card shadow-2xl",
            "right-4 bottom-20 rounded-2xl",
            "w-[calc(100vw-24px)] max-w-[380px]",
            "h-[70vh] max-h-[620px]",
            "md:right-6 md:bottom-24",
            "md:w-[380px] md:h-[560px]"
          )}
        >
          <div className="flex h-full flex-col overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-background/80 backdrop-blur">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Brain className="h-4 w-4 text-primary" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      Finsight AI Copilot
                    </p>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                      <Sparkles className="h-3 w-3" />
                      Beta
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    Finance-only assistant for your data
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                aria-label="Close AI Copilot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Clear chat row */}
            <div className="flex items-center justify-end border-b border-border px-4 py-2 bg-card">
              <button
                onClick={clearChat}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear chat
              </button>
            </div>

            {/* Starter prompts */}
            <div className="border-b border-border px-3 py-3 bg-card">
              <div className="flex flex-wrap gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    disabled={loading}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] text-foreground hover:bg-accent transition-all disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 bg-background/50">
              <div className="flex flex-col gap-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                      msg.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "mr-auto bg-muted text-foreground"
                    )}
                  >
                    {msg.text}
                  </div>
                ))}

                {loading && (
                  <div className="mr-auto flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-foreground shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border bg-card p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about spending, savings, EMI, budget..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                  aria-label="Send message"
                >
                  <SendHorizonal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
