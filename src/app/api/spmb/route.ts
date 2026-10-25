import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { periksaSpmb } from "@/lib/spmb";

/**
 * app/api/spmb/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/spmb — simpan formulir SPMB / PPDB mandiri.
 *
 *   1. Validasi seluruh isian dengan `periksaSpmb` (aturan yang sama dengan
 *      formulir di /spmb).
 *   2. Tolak email yang sudah pernah mendaftar (satu email = satu pendaftaran).
 *   3. Simpan ke tabel `spmb_pendaftar` memakai service role — publik tidak
 *      punya akses langsung ke tabel tersebut (RLS tanpa policy).
 *
 * Tidak perlu login: formulir ini terbuka untuk calon siswa / orang tua.
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

const TABEL = "spmb_pendaftar";

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Layanan pendaftaran SPMB belum dikonfigurasi di Environment Variable (termasuk SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, message: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  const { galat, data } = periksaSpmb(body as Record<string, unknown>);

  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        message: Object.values(galat)[0] ?? "Data pendaftaran belum lengkap.",
        galat,
      },
      { status: 400 }
    );
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Satu email hanya boleh mendaftar sekali. Indeks unik di database tetap
  // menjadi pengaman terakhir bila ada dua kiriman bersamaan.
  const { data: sudahAda, error: errorCek } = await admin
    .from(TABEL)
    .select("id")
    .eq("email", data.email)
    .limit(1)
    .maybeSingle();

  if (errorCek) {
    return galatDatabase(errorCek);
  }

  if (sudahAda) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Email ini sudah pernah didaftarkan. Hubungi panitia SPMB bila perlu mengubah data.",
        galat: { email: "Email ini sudah pernah didaftarkan." },
      },
      { status: 409 }
    );
  }

  const { error: errorSimpan } = await admin.from(TABEL).insert(data);

  if (errorSimpan) {
    if (errorSimpan.code === "23505") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Email ini sudah pernah didaftarkan. Hubungi panitia SPMB bila perlu mengubah data.",
          galat: { email: "Email ini sudah pernah didaftarkan." },
        },
        { status: 409 }
      );
    }
    return galatDatabase(errorSimpan);
  }

  return NextResponse.json({
    ok: true,
    message:
      "Pendaftaran SPMB berhasil dikirim. Panitia akan menghubungi Anda melalui email atau WhatsApp.",
  });
}

/**
 * Pesan yang jelas bila tabel belum dibuat, supaya panitia tidak bingung
 * melihat daftar kosong tanpa sebab.
 */
function galatDatabase(error: { code?: string; message: string }) {
  const tabelHilang =
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /relation .*spmb_pendaftar.* does not exist|Could not find the table/i.test(error.message);

  if (tabelHilang) {
    console.warn("[spmb] tabel spmb_pendaftar belum ada:", error.message);
    return NextResponse.json(
      {
        ok: false,
        message:
          "Tabel pendaftaran belum tersedia. Jalankan migrasi supabase/migrations/20261025000000_add_spmb_pendaftar.sql terlebih dahulu.",
      },
      { status: 503 }
    );
  }

  console.warn("[spmb] gagal menyimpan pendaftaran:", error.message);
  return NextResponse.json(
    {
      ok: false,
      message: "Gagal menyimpan pendaftaran. Silakan coba lagi beberapa saat lagi.",
    },
    { status: 500 }
  );
}
