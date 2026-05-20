"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CharacterCard } from "@/components/CharacterCard";

interface Character {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
}

export default function CharactersPage() {
  const router = useRouter();
  const { status } = useSession();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    
    if (status === "authenticated") {
      fetch("/api/characters")
        .then(res => res.json() as Promise<Character[]>)
        .then((data: Character[]) => {
          setCharacters(data || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [status, router]);

  const handleSelectCharacter = async (characterId: string) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      if (res.ok) {
        const data = await res.json() as { id: string };
        router.push(`/chat/${data.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-16 px-6 sm:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">누구와 대화하시겠어요?</h1>
          <p className="text-gray-400">마음에 드는 캐릭터를 선택하고 새로운 인연을 시작해보세요.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              id={char.id}
              name={char.name}
              description={char.description}
              avatarUrl={char.avatarUrl}
              onClick={handleSelectCharacter}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
