"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Message from "@/components/Message";
import Sidebar from "@/components/Sidebar";
import { ChatMessage } from "@/types/chat";

const modelOptions = ["text", "code", "roleplay", "tech", "translate"] as const;
type ModelType = (typeof modelOptions)[number];

interface ChatItem {
  _id: string;
  title: string;
  messages: ChatMessage[];
}

export default function DashboardPage() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [model, setModel] = useState<ModelType>("text");

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setToken(stored);
  }, [router]);

  useEffect(() => {
    if (!token) return null;

    const loadChats = async () => {
      const res = await fetch("/api/chat", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return null;
      const data = (await res.json()) as { chats: ChatItem[] };
      setChats(data.chats);
      if (data.chats.length > 0) {
        setActiveChatId(data.chats[0]._id);
      }
    };

    void loadChats();
  }, [token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChatId]);

  const activeChat = useMemo(() => chats.find((chat) => chat._id === activeChatId) ?? null, [chats, activeChatId]);

  const createChat = async (): Promise<string | null> => {
    if (!token) return null;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title: "New Chat" })
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { chat: ChatItem };
    setChats((prev) => [data.chat, ...prev]);
    setActiveChatId(data.chat._id);
    return data.chat._id;
  };

  const saveMessages = async (chatId: string, messages: ChatMessage[]) => {
    if (!token) return null;
    await fetch(`/api/chat/${chatId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !input.trim() || sending) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = await createChat();
      if (!chatId) return;
    }

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const assistantPlaceholder: ChatMessage = { role: "assistant", content: "" };

    const currentMessages = activeChat?.messages ?? [];
    const nextMessages = [...currentMessages, userMessage, assistantPlaceholder];

    setChats((prev) =>
      prev.map((chat) => (chat._id === chatId ? { ...chat, messages: nextMessages } : chat))
    );
    setInput("");
    setSending(true);

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ type: model, messages: [...currentMessages, userMessage] })
    });

    if (!res.ok || !res.body) {
      setSending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let aiText = "";

    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      if (chunk.value) {
        aiText += decoder.decode(chunk.value, { stream: true });
        setChats((prev) =>
          prev.map((chat) => {
            if (chat._id !== chatId) return chat;
            const updatedMessages = [...chat.messages];
            updatedMessages[updatedMessages.length - 1] = {
              role: "assistant",
              content: aiText
            };
            return { ...chat, messages: updatedMessages };
          })
        );
      }
    }

    const finalChat = chats.find((chat) => chat._id === chatId);
    const finalMessages = finalChat?.messages
      ? [...finalChat.messages.slice(0, -1), { role: "assistant", content: aiText }]
      : [...currentMessages, userMessage, { role: "assistant", content: aiText }];

    await saveMessages(chatId, finalMessages);
    setSending(false);
  };

  return (
    <div className="h-screen flex">
      <Sidebar chats={chats} activeChatId={activeChatId} onSelectChat={setActiveChatId} onNewChat={createChat} />

      <main className="flex-1 flex flex-col">
        <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ModelType)}
              className="rounded-md bg-zinc-800 px-2 py-1 text-sm"
            >
              {modelOptions.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/login");
              }}
              className="rounded-md border border-zinc-700 px-3 py-1 text-sm"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {activeChat?.messages.map((message, index) => (
            <Message key={`${message.role}-${index}`} message={message} />
          ))}
          <div ref={endRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-zinc-800 p-4 flex gap-2">
          <input
            className="flex-1 rounded-lg bg-zinc-800 px-4 py-3"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            disabled={sending}
            className="rounded-lg bg-zinc-100 text-zinc-900 font-semibold px-4"
            type="submit"
          >
            {sending ? "..." : "Send"}
          </button>
        </form>
      </main>
    </div>
  );
}
