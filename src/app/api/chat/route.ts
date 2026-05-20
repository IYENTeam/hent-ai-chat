import { nanoid } from "nanoid";
import { eq, asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { auth } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { streamChatCompletion, type ChatMessage } from "@/lib/llm";
import { detectEmotion } from "@/lib/emotions";

const MAX_HISTORY = 20;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json() as { conversationId?: string; content?: string };
  const { conversationId, content } = body;
  if (!conversationId || !content) {
    return new Response("conversationId and content required", { status: 400 });
  }

  const env = getEnv();
  const db = getDb(env.DB);

  const convo = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.id, conversationId))
    .get();

  if (!convo || convo.userId !== session.user.id) {
    return new Response("Conversation not found", { status: 404 });
  }

  const character = await db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, convo.characterId))
    .get();

  if (!character) {
    return new Response("Character not found", { status: 404 });
  }

  await db.insert(schema.messages).values({
    id: nanoid(),
    conversationId,
    role: "user",
    content,
  });

  const history = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(asc(schema.messages.createdAt))
    .limit(MAX_HISTORY);

  const llmMessages: ChatMessage[] = [
    { role: "system", content: character.chatPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const llmConfig = {
    proxyUrl: env.LLM_PROXY_URL ?? "",
    apiKey: env.LLM_PROXY_API_KEY ?? "",
    model: env.LLM_MODEL ?? "gpt-4o-mini",
  };

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChatCompletion(llmConfig, llmMessages)) {
          fullResponse += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }

        const emotion = detectEmotion(fullResponse);
        const emotionImages = JSON.parse(character.emotionImages);

        await db.insert(schema.messages).values({
          id: nanoid(),
          conversationId,
          role: "assistant",
          content: fullResponse,
          emotion,
        });

        await db
          .update(schema.conversations)
          .set({ updatedAt: new Date().toISOString() })
          .where(eq(schema.conversations.id, conversationId));

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, emotion, emotionImage: emotionImages[emotion] ?? emotionImages.calm })}\n\n`,
          ),
        );
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
