"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  characterId: string;
  characterName: string;
  updatedAt: string;
}

interface SidebarProps {
  conversations: Conversation[];
  currentId?: string;
}

export function Sidebar({ conversations, currentId }: SidebarProps) {
  const router = useRouter();

  return (
    <div className="w-full md:w-72 flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col h-full overflow-hidden shadow-2xl z-20">
      <div className="p-4 border-b border-gray-800/50 backdrop-blur-sm">
        <button
          onClick={() => router.push("/characters")}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-rose-600 hover:to-pink-600 text-white p-3 rounded-xl transition-all duration-300 shadow-md border border-gray-700 hover:border-transparent group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110 group-active:scale-95" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">새로운 대화 시작</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-10 px-4 text-sm">
            아직 대화 내역이 없습니다.
            <br />
            새로운 인연을 만들어보세요.
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === currentId;
            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className={`block p-4 rounded-2xl transition-all duration-200 border ${
                  isActive 
                    ? "bg-gray-800/80 border-rose-500/30 shadow-lg shadow-rose-900/10" 
                    : "bg-transparent border-transparent hover:bg-gray-900 hover:border-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isActive ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-gray-700"}`} />
                  <span className={`font-medium truncate ${isActive ? "text-rose-100" : "text-gray-300"}`}>
                    {conv.characterName}
                  </span>
                </div>
                <div className="mt-1.5 ml-5 text-xs text-gray-500">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
