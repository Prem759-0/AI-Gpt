"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import Message from "@/components/Message";
import type { ChatDocument, ChatMessage } from "@/types/chat";

const modelOptions = {
  text: "google/gemma-4-26b-a4b-it:free",
  code: "openai/gpt-oss-120b:free",
  roleplay: "z-ai/glm-4.5-air:free",
  tech: "nvidia/nemotron-3-super-120b-a12b:free",
  translate: "minimax/minimax-m2.5:free"
} as const;

type ModelType = keyof typeof modelOptions;

export default function DashboardPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string>("");
  const [chats, setChats] = useState<ChatDocument[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [modelType, setModelType] = useState<ModelType>("text");
  const [loading, setLoading] = useState(false);

  const activeChat = useMemo(
    () => chats.find((chat) => chat._id === activeChatId) ?? null,
    [chats, activeChatId]
  );

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!stored) {
      router.push("/login");
      return;
    }
    setToken(stored);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const loadChats = async () => {
      const res = await fetch("/api/chat", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data: { chats: ChatDocument[] } = await res.json();
      setChats(data.chats);
      if (data.chats[0]) {
        setActiveChatId(data.chats[0]._id);
      }
    };
    void loadChats();
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeChat?.messages]);

  const createChat = async (): Promise<string | null> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title: "New Chat" })
    });
    if (!res.ok) return null;
    const data: { chat: ChatDocument } = await res.json();
    setChats((prev) => [data.chat, ...prev]);
    setActiveChatId(data.chat._id);
    return data.chat._id;
  };

  const sendMessage = async () => {
    if (!input.trim() || !token || loading) return;
    setLoading(true);
    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const assistantMessage: ChatMessage = { role: "assistant", content: "" };
    const chatId = activeChatId ?? (await createChat());
    if (!chatId) {
      setLoading(false);
      return;
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat._id === chatId
          ? { ...chat, messages: [...chat.messages, userMessage, assistantMessage] }
          : chat
      )
    );
    setInput("");

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        chatId,
        type: modelType,
        messages: [...(activeChat?.messages ?? []), userMessage]
      })
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let streamedText = "";

    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      const value = decoder.decode(chunk.value || new Uint8Array(), { stream: true });
      streamedText += value;
      setChats((prev) =>
        prev.map((chat) => {
          if (chat._id !== chatId) return chat;
          const updated = [...chat.messages];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
            updated[lastIndex] = { role: "assistant", content: streamedText };
          }
          return { ...chat, messages: updated };
        })
      );
    }

    await fetch(`/api/chat/${chatId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [...(activeChat?.messages ?? []), userMessage, { role: "assistant", content: streamedText }]
      })
    });

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen">
      <Sidebar chats={chats} activeChatId={activeChatId} onSelect={setActiveChatId} onNewChat={() => void createChat()} />
      <section className="flex flex-1 flex-col">
        <MobileSidebar chats={chats} activeChatId={activeChatId} onSelect={setActiveChatId} onNewChat={() => void createChat()} />
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h1 className="font-semibold">Dashboard</h1>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value as ModelType)}
            className="rounded-lg bg-zinc-800 px-3 py-2 text-sm"
          >
            {Object.keys(modelOptions).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {activeChat?.messages.map((message, index) => (
            <Message key={`${message.role}-${index}`} message={message} />
          ))}
        </div>

        <div className="border-t border-zinc-800 p-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendMessage();
              }}
              className="flex-1 rounded-xl bg-zinc-800 px-4 py-3"
              placeholder="Ask anything..."
            />
            <button onClick={() => void sendMessage()} disabled={loading} className="rounded-xl bg-indigo-600 px-4 py-3 disabled:opacity-60">
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
