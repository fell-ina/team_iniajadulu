import { NextResponse } from "next/server";
import {
  ambilTopik,
  bolehIkutForum,
  buatAdmin,
  petaNama,
  sesiForum,
  topikDariBaris,
  type BarisTopik,
} from "@/lib/forum-server";
import {
  KATEGORI_GURU,
  KATEGORI_SISWA,
  kategoriValid,
  type KelasForum,
} from "@/lib/forum-types";

/**
 * app/api/forum/topik/route.ts
 * ---------------------------------------------------------------------------
 * GET  /api/forum/topik?kelas=X        daftar topik satu kelas (siswa)
 * GET  /api/forum/topik?lingkup=guru   daftar topik forum guru (kelas NULL)
 * POST /api/forum/topik { judul, konten, kategori }
 *      -> menulis baris baru ke public.forum_topik
 *
 * Kelas topik tidak diambil dari body untuk siswa: selalu kelas di profilnya,
 * supaya siswa tidak bisa menulis ke forum kelas lain.
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

const KELAS = ["X", "XI", "XII"];

function teks(nilai: unknown): string {
  return typeof nilai === "string" ? nilai.trim() : "";
}

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const lingkup = url.searchParams.get("lingkup");
  const diminta = url.searchParams.get("kelas");

  let kelas: KelasForum | null = null;

  if (lingkup === "guru") {
    if (sesi.role === "siswa") {
      return NextResponse.json(
        { ok: false, message: "Forum guru hanya untuk guru dan admin." },
        { status: 403 }
      );
    }
  } else if (sesi.role === "siswa") {
    if (!sesi.kelas) {
      return NextResponse.json(
        { ok: false, message: "Kelas akun Anda belum diatur." },
        { status: 403 }
      );
    }
    if (diminta && diminta !== sesi.kelas) {
      return NextResponse.json(
        { ok: false, message: "Anda hanya bisa membuka forum kelas Anda sendiri." },
        { status: 403 }
      );
    }
    kelas = sesi.kelas;
  } else {
    if (diminta !== null && !KELAS.includes(diminta)) {
      return NextResponse.json(
        { ok: false, message: "Kelas tidak dikenal." },
        { status: 400 }
      );
    }
    kelas = (diminta as KelasForum | null) ?? null;
  }

  try {
    const topik = await ambilTopik(kelas, sesi.userId);
    return NextResponse.json(
      { ok: true, topik },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[forum/topik GET]", error);
    return NextResponse.json(
      { ok: false, message: "Gagal memuat diskusi forum." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const judul = teks(body?.judul);
  const konten = teks(body?.konten);
  const kategori = teks(body?.kategori);

  if (judul.length < 3) {
    return NextResponse.json(
      { ok: false, message: "Judul diskusi minimal 3 karakter." },
      { status: 400 }
    );
  }
  if (judul.length > 160) {
    return NextResponse.json(
      { ok: false, message: "Judul diskusi maksimal 160 karakter." },
      { status: 400 }
    );
  }
  if (!konten) {
    return NextResponse.json(
      { ok: false, message: "Isi diskusi wajib diisi." },
      { status: 400 }
    );
  }
  if (konten.length > 10000) {
    return NextResponse.json(
      { ok: false, message: "Isi diskusi maksimal 10.000 karakter." },
      { status: 400 }
    );
  }

  let kelas: KelasForum | null = null;
  let daftarKategori = KATEGORI_GURU;

  if (sesi.role === "siswa") {
    if (!sesi.kelas) {
      return NextResponse.json(
        { ok: false, message: "Kelas akun Anda belum diatur." },
        { status: 403 }
      );
    }
    const diminta = teks(body?.kelas);
    if (diminta && diminta !== sesi.kelas) {
      return NextResponse.json(
        { ok: false, message: "Anda hanya bisa menulis di forum kelas Anda sendiri." },
        { status: 403 }
      );
    }
    kelas = sesi.kelas;
    daftarKategori = KATEGORI_SISWA;
  } else if (body?.kelas) {
    if (sesi.role !== "admin") {
      // Guru tetap menulis ke forum guru (kelas NULL).
      return NextResponse.json(
        { ok: false, message: "Forum guru tidak terikat kelas." },
        { status: 400 }
      );
    }
    const diminta = teks(body?.kelas);
    if (!KELAS.includes(diminta)) {
      return NextResponse.json(
        { ok: false, message: "Kelas tidak dikenal." },
        { status: 400 }
      );
    }
    kelas = diminta as KelasForum;
    daftarKategori = KATEGORI_SISWA;
  }

  if (!kategoriValid(kategori, daftarKategori)) {
    return NextResponse.json(
      { ok: false, message: "Kategori diskusi tidak dikenal." },
      { status: 400 }
    );
  }

  const { data, error } = await buatAdmin()
    .from("forum_topik")
    .insert({ judul, konten, kategori, kelas, penulis_id: sesi.userId })
    .select("*")
    .single();

  if (error) {
    console.error("[forum/topik POST]", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error.code === "22P02" ||
          error.code === "23502" ||
          error.code === "23514"
            ? "Forum guru belum aktif di database. Jalankan supabase/migrations/20261026000000_forum_guru.sql lebih dulu."
            : "Gagal menyimpan diskusi.",
      },
      { status: 500 }
    );
  }

  const nama = await petaNama([sesi.userId]);
  return NextResponse.json(
    { ok: true, topik: topikDariBaris(data as BarisTopik, nama, new Set()) },
    { status: 201 }
  );
}
