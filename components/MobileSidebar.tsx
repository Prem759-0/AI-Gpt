"use client";

import type { ChatDocument } from "@/types/chat";

interface MobileSidebarProps {
  chats: ChatDocument[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export default function MobileSidebar({ chats, activeChatId, onSelect, onNewChat }: MobileSidebarProps) {
  return (
    <div className="border-b border-zinc-800 p-3 md:hidden">
      <button onClick={onNewChat} className="mb-2 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500">
        + New Chat
      </button>
      <div className="flex gap-2 overflow-x-auto">
        {chats.map((chat) => (
          <button
            key={chat._id}
            onClick={() => onSelect(chat._id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs ${activeChatId === chat._id ? "bg-zinc-700" : "bg-zinc-800"}`}
          >
            {chat.title}
          </button>
        ))}
      </div>
    </div>
  );
}
