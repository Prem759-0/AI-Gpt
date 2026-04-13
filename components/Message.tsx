import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/types/chat";

export default function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? "bg-indigo-600" : "bg-zinc-800"}`}>
        <div className="prose prose-invert prose-pre:bg-zinc-900 prose-pre:p-3 prose-pre:rounded-lg max-w-none text-sm">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
