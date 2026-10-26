import { NextResponse } from "next/server";
import { getBalasanList, createBalasan, CreateBalasanInput } from "@/lib/forum-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topikId = searchParams.get("topik_id");
    
    if (!topikId) {
      return NextResponse.json({ error: "topik_id wajib diisi" }, { status: 400 });
    }
    
    const balasan = await getBalasanList(topikId);
    return NextResponse.json(balasan);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input: CreateBalasanInput = {
      topik_id: body.topik_id,
      konten: body.konten,
      parent_id: body.parent_id ?? null,
    };

    if (!input.topik_id || !input.konten) {
      return NextResponse.json({ error: "topik_id dan konten wajib diisi" }, { status: 400 });
    }

    const balasan = await createBalasan(input);
    return NextResponse.json(balasan, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}