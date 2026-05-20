"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { EmotionImage } from "@/components/EmotionImage";
import { DEFAULT_EMOTION } from "@/lib/emotions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatData {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  messages: Message[];
  currentEmotion?: string;
}

interface Conversation {
  id: string;
  title: string;
  characterId: string;
  characterName: string;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChatPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const { status } = useSession();
  const [chat, setChat] = useState<ChatData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emotion, setEmotion] = useState<string>(DEFAULT_EMOTION);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    Promise.all([
      fetch(`/api/conversations/${params.id}`).then(res => res.json() as Promise<ChatData>),
      fetch("/api/conversations").then(res => res.json() as Promise<Conversation[]>)
    ])
    .then(([chatData, convData]: [ChatData, Conversation[]]) => {
      setChat(chatData);
      setConversations(convData || []);
      if (chatData.currentEmotion) {
        setEmotion(chatData.currentEmotion);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [params.id, status]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages, streamingMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !chat) return;

    const userMessage = input.trim();
    setInput("");
    setIsTyping(true);
    setStreamingMessage("");

    setChat(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [
          ...prev.messages,
          { id: Date.now().toString(), role: "user", content: userMessage }
        ]
      };
    });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: params.id, content: userMessage }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let currentText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                if (data.emotion) {
                  setEmotion(data.emotion);
                }
                setChat(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    messages: [
                      ...prev.messages,
                      { id: Date.now().toString(), role: "assistant", content: currentText }
                    ]
                  };
                });
                setStreamingMessage("");
              } else if (data.content) {
                currentText += data.content;
                setStreamingMessage(currentText);
              }
            } catch (e) {
              console.error("Failed to parse SSE data", e, dataStr);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!chat) return <div className="h-screen bg-gray-950 text-white flex items-center justify-center">대화를 찾을 수 없습니다.</div>;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <div className="hidden md:block h-full">
        <Sidebar conversations={conversations} currentId={params.id} />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        <div className="w-full lg:w-1/2 p-4 lg:p-8 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-950/50 backdrop-blur-sm z-10 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
          <EmotionImage 
            characterId={chat.characterId} 
            emotion={emotion} 
            characterName={chat.characterName} 
          />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col h-[60vh] lg:h-full bg-gray-950/95 relative z-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar" ref={scrollContainerRef}>
            {chat.messages.map((msg, i) => (
              <ChatMessage 
                key={msg.id || i} 
                role={msg.role} 
                content={msg.content} 
                avatarUrl={msg.role === "assistant" ? chat.characterAvatar : undefined}
              />
            ))}
            {streamingMessage && (
              <ChatMessage 
                role="assistant" 
                content={streamingMessage} 
                avatarUrl={chat.characterAvatar}
              />
            )}
            {isTyping && !streamingMessage && (
              <div className="flex w-full justify-start mb-6">
                <div className="flex items-end gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700 animate-pulse" />
                  <div className="px-5 py-4 rounded-3xl bg-gray-800 rounded-bl-sm border border-gray-700 flex gap-1.5 items-center h-[52px]">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>

          <div className="p-4 bg-gray-950/80 backdrop-blur-xl border-t border-gray-800/80">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                placeholder={isTyping ? "답변을 기다리는 중..." : "메시지를 입력하세요..."}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all disabled:opacity-50 placeholder-gray-500 shadow-inner group-hover:border-gray-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white disabled:opacity-50 disabled:hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-rose-900/30"
              >
                <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
