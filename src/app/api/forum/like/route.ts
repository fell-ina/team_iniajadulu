import { NextResponse } from "next/server";
import { toggleLikeTopik, toggleLikeBalasan } from "@/lib/forum-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topik_id, balasan_id } = body;

    if (!topik_id && !balasan_id) {
      return NextResponse.json({ error: "topik_id atau balasan_id wajib diisi" }, { status: 400 });
    }
    if (topik_id && balasan_id) {
      return NextResponse.json({ error: "Hanya boleh salah satu: topik_id atau balasan_id" }, { status: 400 });
    }

    let result;
    if (topik_id) {
      result = await toggleLikeTopik(topik_id);
    } else {
      result = await toggleLikeBalasan(balasan_id!);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}