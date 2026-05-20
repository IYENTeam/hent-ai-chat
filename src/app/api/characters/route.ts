import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { auth } from "@/lib/auth";
import { getEnv } from "@/lib/env";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = getEnv();
  const db = getDb(env.DB);
  const chars = await db.select().from(schema.characters);

  return NextResponse.json(
    chars.map((c) => ({
      ...c,
      emotionImages: JSON.parse(c.emotionImages),
    })),
  );
}
