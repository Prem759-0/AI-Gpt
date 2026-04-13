"use client";

interface SidebarChat {
  _id: string;
  title: string;
}

interface SidebarProps {
  chats: SidebarChat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

export default function Sidebar({ chats, activeChatId, onSelectChat, onNewChat }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-72 border-r border-zinc-800 bg-zinc-900/70 p-4 flex-col gap-3">
      <button className="rounded-lg bg-zinc-100 text-zinc-900 py-2 font-semibold" onClick={onNewChat}>
        + New Chat
      </button>
      <div className="space-y-2 overflow-auto">
        {chats.map((chat) => (
          <button
            key={chat._id}
            onClick={() => onSelectChat(chat._id)}
            className={`w-full text-left rounded-lg px-3 py-2 text-sm ${
              activeChatId === chat._id ? "bg-zinc-700" : "bg-zinc-800 hover:bg-zinc-700/70"
            }`}
          >
            {chat.title}
          </button>
        ))}
      </div>
    </aside>
  );
}
