import Image from "next/image";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  avatarUrl?: string;
}

export function ChatMessage({ role, content, avatarUrl }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div className={`flex max-w-[85%] sm:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"} gap-3 items-end`}>
        {!isUser && avatarUrl && (
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-800 shadow-md">
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
          </div>
        )}
        
        <div 
          className={`px-5 py-3.5 rounded-3xl whitespace-pre-wrap leading-relaxed ${
            isUser 
              ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-br-sm shadow-rose-500/20 shadow-lg" 
              : "bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700 shadow-xl"
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
