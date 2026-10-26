import { NextResponse } from "next/server";
import { ambilBalasan, ambilTopikSatu, bolehIkutForum, sesiForum } from "@/lib/forum-server";

/**
 * app/api/forum/topik/[id]/route.ts
 * ---------------------------------------------------------------------------
 * GET /api/forum/topik/:id -> satu topik + balasannya (pohon satu tingkat).
 * Siswa hanya boleh membuka topik kelasnya sendiri.
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await sesiForum();

  if (!sesi) {
    return NextResponse.json(
      { ok: false, message: "Anda harus masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  if (!bolehIkutForum(sesi)) {
    return NextResponse.json(
      { ok: false, message: "Akun Anda belum terverifikasi untuk ikut forum." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const topik = await ambilTopikSatu(id);
    if (!topik) {
      return NextResponse.json(
        { ok: false, message: "Diskusi tidak ditemukan." },
        { status: 404 }
      );
    }

    if (sesi.role === "siswa" && topik.kelas !== sesi.kelas) {
      return NextResponse.json(
        { ok: false, message: "Anda hanya bisa membuka forum kelas Anda sendiri." },
        { status: 403 }
      );
    }

    const balasan = await ambilBalasan(id);
    return NextResponse.json(
      { ok: true, topik, balasan },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[forum/topik/:id GET]", error);
    return NextResponse.json(
      { ok: false, message: "Gagal memuat diskusi." },
      { status: 500 }
    );
  }
}
