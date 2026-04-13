"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Send, Sparkles, User } from "lucide-react";
import type { ChatMessage } from "@/types/chat";
import { models, type ModelType } from "@/lib/models";

const modelLabels: Record<ModelType, string> = {
  text: "Text",
  code: "Code",
  roleplay: "Roleplay",
  tech: "Tech",
  translate: "Translate"
};

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelType, setModelType] = useState<ModelType>("text");

  const canSend = useMemo(() => !loading && input.trim().length > 0, [input, loading]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input.trim();

    if (!message || loading) return;

    setError(null);
    setLoading(true);
    setInput("");

    const userMessage: ChatMessage = { role: "user", content: message };
    const assistantMessage: ChatMessage = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, type: modelType })
      });

      if (!response.ok || !response.body) {
        const failure = (await response.json().catch(() => ({ error: "Request failed" }))) as {
          error?: string;
        };
        throw new Error(failure.error ?? "Unable to process AI request");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;

          const payload = line.replace(/^data:\s*/, "");
          if (payload === "[DONE]") continue;

          const parsed = JSON.parse(payload) as { content?: string };
          if (!parsed.content) continue;

          setMessages((prev) => {
            const next = [...prev];
            const lastIndex = next.length - 1;
            if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
              next[lastIndex] = {
                ...next[lastIndex],
                content: next[lastIndex].content + parsed.content
              };
            }
            return next;
          });
        }
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unknown error");
      setMessages((prev) => prev.filter((item, index) => index !== prev.length - 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h1 className="text-lg font-semibold md:text-xl">AI SaaS Pro</h1>
        </div>
        <select
          value={modelType}
          onChange={(event) => setModelType(event.target.value as ModelType)}
          className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm"
        >
          {Object.keys(models).map((key) => (
            <option key={key} value={key}>
              {modelLabels[key as ModelType]}
            </option>
          ))}
        </select>
      </div>

      <section className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-zinc-400"
            >
              Start chatting with AI...
            </motion.p>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={`${message.role}-${index}-${message.content.length}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border px-3 py-2 ${
                  message.role === "user"
                    ? "ml-auto max-w-[90%] border-zinc-700 bg-zinc-800"
                    : "mr-auto max-w-[90%] border-zinc-800 bg-zinc-900"
                }`}
              >
                <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400">
                  {message.role === "user" ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                  {message.role}
                </p>
                {message.role === "assistant" ? (
                  <div className="prose prose-invert max-w-none prose-p:my-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </section>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask anything..."
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-violet-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          {loading ? "Thinking..." : "Send"}
        </button>
      </form>
    </main>
  );
}
