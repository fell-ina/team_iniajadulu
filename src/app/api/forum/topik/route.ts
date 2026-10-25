import { NextResponse } from "next/server";
import { getTopikList, createTopik, CreateTopikInput } from "@/lib/forum-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get("kelas") as "X" | "XI" | "XII";
    const kategori = searchParams.get("kategori") as "tugas" | "project" | "tanya_jawab" | "pengalaman" | "all" | null;
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") as "terbaru" | "terlama" | "terpopuler" | "terbanyak_balasan" | null;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    if (!kelas || !["X", "XI", "XII"].includes(kelas)) {
      return NextResponse.json({ error: "Kelas tidak valid" }, { status: 400 });
    }

    const result = await getTopikList({
      kelas,
      kategori: kategori ?? "all",
      search: search ?? undefined,
      sort: sort ?? "terbaru",
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input: CreateTopikInput = {
      judul: body.judul,
      konten: body.konten,
      kategori: body.kategori,
      kelas: body.kelas,
    };

    if (!input.judul || !input.konten || !input.kategori || !input.kelas) {
      return NextResponse.json({ error: "Field judul, konten, kategori, dan kelas wajib diisi" }, { status: 400 });
    }

    const topik = await createTopik(input);
    return NextResponse.json(topik, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}