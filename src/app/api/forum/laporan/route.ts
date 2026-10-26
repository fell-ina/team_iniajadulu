import { NextResponse } from "next/server";
import { createLaporan } from "@/lib/forum-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topik_id, balasan_id, alasan } = body;

    if (!alasan) {
      return NextResponse.json({ error: "Alasan wajib diisi" }, { status: 400 });
    }
    if (!topik_id && !balasan_id) {
      return NextResponse.json({ error: "topik_id atau balasan_id wajib diisi" }, { status: 400 });
    }
    if (topik_id && balasan_id) {
      return NextResponse.json({ error: "Hanya boleh salah satu: topik_id atau balasan_id" }, { status: 400 });
    }

    await createLaporan({ topik_id, balasan_id, alasan });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}