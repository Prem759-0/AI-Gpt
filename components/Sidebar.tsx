"use client";

import type { ChatDocument } from "@/types/chat";

interface SidebarProps {
  chats: ChatDocument[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export default function Sidebar({ chats, activeChatId, onSelect, onNewChat }: SidebarProps) {
  return (
    <aside className="hidden w-72 border-r border-zinc-800 bg-zinc-900/60 p-4 md:block">
      <button onClick={onNewChat} className="mb-4 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500">
        + New Chat
      </button>
      <div className="space-y-2">
        {chats.map((chat) => (
          <button
            key={chat._id}
            onClick={() => onSelect(chat._id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${activeChatId === chat._id ? "bg-zinc-700" : "bg-zinc-800 hover:bg-zinc-700"}`}
          >
            {chat.title}
          </button>
        ))}
      </div>
    </aside>
  );
}
