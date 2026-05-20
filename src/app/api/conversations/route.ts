import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { auth } from "@/lib/auth";
import { getEnv } from "@/lib/env";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = getEnv();
  const db = getDb(env.DB);

  const convos = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.userId, session.user.id))
    .orderBy(desc(schema.conversations.updatedAt));

  return NextResponse.json(convos);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await request.json() as { characterId?: string };
  if (!characterId) {
    return NextResponse.json({ error: "characterId required" }, { status: 400 });
  }

  const env = getEnv();
  const db = getDb(env.DB);

  const character = await db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, characterId))
    .get();

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const id = nanoid();
  const now = new Date().toISOString();

  await db.insert(schema.conversations).values({
    id,
    userId: session.user.id,
    characterId,
    title: `${character.name}과의 대화`,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id, characterId, title: `${character.name}과의 대화` });
}
