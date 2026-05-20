"use client";

import Image from "next/image";
import { DATE_EMOTIONS, DEFAULT_EMOTION } from "@/lib/emotions";

interface EmotionImageProps {
  characterId: string;
  emotion: string;
  characterName: string;
}

export function EmotionImage({ characterId, emotion, characterName }: EmotionImageProps) {
  const currentEmotion = DATE_EMOTIONS.find((e) => e.id === emotion) || DATE_EMOTIONS.find((e) => e.id === DEFAULT_EMOTION);
  const emotionFile = currentEmotion?.defaultFile || "calm.png";
  const emotionLabel = currentEmotion?.label || "";

  return (
    <div className="relative w-full aspect-[3/4] max-w-sm mx-auto overflow-hidden rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl shadow-rose-900/20 group">
      <Image
        key={`${characterId}-${emotion}`}
        src={`/assets/characters/${characterId}/${emotionFile}`}
        alt={`${characterName} - ${emotionLabel}`}
        fill
        className="object-cover animate-fade-in transition-transform duration-700 ease-out group-hover:scale-105"
        priority
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent pointer-events-none" />
      
      <div className="absolute bottom-6 left-0 w-full flex flex-col items-center justify-end z-10 px-4">
        <span className="px-4 py-2 bg-gray-950/80 backdrop-blur-md rounded-full border border-gray-800 text-rose-300 text-sm font-medium shadow-lg transition-all">
          {emotionLabel}
        </span>
      </div>
    </div>
  );
}
