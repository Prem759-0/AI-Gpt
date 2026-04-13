"use client";

import { FormEvent, useState } from "react";
import type { AiResponse, ChatMessage } from "@/types/chat";

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    setError(null);
    setLoading(true);
    setInput("");

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text, type: "text" })
      });

      const data = (await response.json()) as AiResponse | { error: string };

      if (!response.ok || !("content" in data)) {
        throw new Error("error" in data ? data.error : "Request failed");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to AI service";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">AI SaaS Pro - Phase 1</h1>

      <section className="flex-1 space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        {messages.length === 0 ? (
          <p className="text-zinc-400">Ask anything to start chatting.</p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-md px-3 py-2 ${
                message.role === "user" ? "bg-zinc-800" : "bg-zinc-700"
              }`}
            >
              <p className="mb-1 text-xs uppercase tracking-wide text-zinc-300">
                {message.role}
              </p>
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            </div>
          ))
        )}
      </section>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-100 px-4 py-2 text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </main>
  );
}
