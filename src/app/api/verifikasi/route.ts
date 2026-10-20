import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * app/api/verifikasi/route.ts
 * ---------------------------------------------------------------------------
 * Verifikasi status pelajar lewat NISN.
 *
 *  - GET  : daftar pengajuan (khusus admin/guru)
 *           ?status=menunggu|terverifikasi|ditolak|semua (default: menunggu)
 *  - POST : siswa mengirim NISN -> verification_status = 'menunggu'
 *           body JSON { nisn }
 *  - PUT  : admin/guru memutuskan pengajuan
 *           body JSON { id, aksi: 'verifikasi' | 'tolak', catatan? }
 *
 * Kolom yang dibutuhkan di tabel public.users (lihat
 * supabase/migrations/20261020000000_add_verifikasi_nisn.sql):
 *   nisn text
 *   verification_status text not null default 'belum'
 *   verification_note text
 *   verification_submitted_at timestamptz
 *   verified_at timestamptz
 *   verified_by uuid
 * ---------------------------------------------------------------------------
 */

type AdminClient = ReturnType<typeof buatAdminClient>;

const STATUS_VALID = ["belum", "menunggu", "terverifikasi", "ditolak"] as const;
const NISN_REGEX = /^\d{10}$/;

const PESAN_KOLOM_HILANG =
  "Kolom verifikasi belum ada di tabel users. Jalankan supabase/migrations/20261020000000_add_verifikasi_nisn.sql di Supabase SQL Editor terlebih dahulu.";

function buatAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function buatSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* abaikan */
          }
        },
      },
    }
  );
}

/** Kenali user dari cookie session. */
async function ambilUserSesi() {
  const supabase = await buatSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Pastikan user berperan admin/guru. */
async function wajibAdminGuru(admin: AdminClient) {
  const user = await ambilUserSesi();
  if (!user) {
    return {
      error: NextResponse.json(
        { ok: false, message: "Anda harus masuk terlebih dahulu." },
        { status: 401 }
      ),
    } as const;
  }

  const { data: profil, error } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return {
      error: NextResponse.json(
        { ok: false, message: "Gagal memeriksa peran pengguna." },
        { status: 500 }
      ),
    } as const;
  }

  if (profil?.role !== "admin" && profil?.role !== "guru") {
    return {
      error: NextResponse.json(
        { ok: false, message: "Hanya admin dan guru yang boleh memverifikasi NISN." },
        { status: 403 }
      ),
    } as const;
  }

  return { user } as const;
}

function galatKolomHilang(pesan: string) {
  return /nisn|verification_|verified_/i.test(pesan);
}

/** Peta id -> email dari Supabase Auth (tabel users tidak menyimpan email). */
async function petaEmail(admin: AdminClient): Promise<Record<string, string>> {
  const peta: Record<string, string> = {};
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    data?.users?.forEach((u) => {
      if (u.id) peta[u.id] = u.email ?? "";
    });
  } catch {
    /* email hanya pelengkap tampilan */
  }
  return peta;
}

/* ============================ GET : daftar =============================== */
export async function GET(request: Request) {
  const admin = buatAdminClient();
  const auth = await wajibAdminGuru(admin);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const statusParam = (searchParams.get("status") ?? "menunggu").trim();
  const status =
    statusParam === "semua" || (STATUS_VALID as readonly string[]).includes(statusParam)
      ? statusParam
      : "menunggu";

  let query = admin
    .from("users")
    .select(
      "id, nama, nisn, verification_status, verification_note, verification_submitted_at, verified_at"
    )
    .not("role", "in", '("admin","guru")')
    .order("verification_submitted_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (status !== "semua") query = query.eq("verification_status", status);

  const { data, error } = await query;

  if (error) {
    console.error("[verifikasi] gagal ambil daftar:", error.message);
    if (galatKolomHilang(error.message)) {
      return NextResponse.json({ ok: false, message: PESAN_KOLOM_HILANG }, { status: 500 });
    }
    return NextResponse.json(
      { ok: false, message: "Gagal memuat daftar verifikasi." },
      { status: 500 }
    );
  }

  const email = await petaEmail(admin);
  const baris = (data ?? []).map((row) => ({
    ...row,
    email: email[String(row.id)] ?? null,
  }));

  return NextResponse.json({
    ok: true,
    status,
    jumlah: baris.length,
    data: baris,
  });
}

/* ======================= POST : siswa kirim NISN ========================= */
export async function POST(request: Request) {
  const user = await ambilUserSesi();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Anda harus masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  let body: { nisn?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }

  const nisn = String(body.nisn ?? "").replace(/\s+/g, "");

  if (!nisn) {
    return NextResponse.json({ ok: false, message: "NISN wajib diisi." }, { status: 400 });
  }
  if (!NISN_REGEX.test(nisn)) {
    return NextResponse.json(
      { ok: false, message: "NISN harus terdiri dari 10 angka." },
      { status: 400 }
    );
  }

  const admin = buatAdminClient();

  const { data: profil, error: errProfil } = await admin
    .from("users")
    .select("role, nisn, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (errProfil) {
    console.error("[verifikasi] gagal baca profil:", errProfil.message);
    if (galatKolomHilang(errProfil.message)) {
      return NextResponse.json({ ok: false, message: PESAN_KOLOM_HILANG }, { status: 500 });
    }
    return NextResponse.json(
      { ok: false, message: "Gagal membaca data akun." },
      { status: 500 }
    );
  }

  if (!profil) {
    return NextResponse.json(
      { ok: false, message: "Profil pengguna tidak ditemukan." },
      { status: 404 }
    );
  }

  // Admin dan guru tidak perlu verifikasi pelajar.
  if (profil.role === "admin" || profil.role === "guru") {
    return NextResponse.json(
      { ok: false, message: "Akun admin/guru tidak perlu verifikasi NISN." },
      { status: 400 }
    );
  }

  if (profil.verification_status === "terverifikasi") {
    return NextResponse.json(
      { ok: false, message: "Akun Anda sudah terverifikasi sebagai pelajar." },
      { status: 400 }
    );
  }

  // Satu NISN hanya untuk satu akun.
  const { data: dipakai, error: errCek } = await admin
    .from("users")
    .select("id")
    .eq("nisn", nisn)
    .neq("id", user.id)
    .limit(1);

  if (errCek) {
    console.error("[verifikasi] gagal cek NISN ganda:", errCek.message);
    return NextResponse.json(
      { ok: false, message: "Gagal memeriksa NISN. Coba lagi sebentar lagi." },
      { status: 500 }
    );
  }

  if (dipakai && dipakai.length > 0) {
    return NextResponse.json(
      { ok: false, message: "NISN ini sudah digunakan akun lain. Periksa kembali NISN Anda." },
      { status: 409 }
    );
  }

  const { error } = await admin
    .from("users")
    .update({
      nisn,
      verification_status: "menunggu",
      verification_note: null,
      verification_submitted_at: new Date().toISOString(),
      verified_at: null,
      verified_by: null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[verifikasi] gagal simpan NISN:", error.message);
    if (galatKolomHilang(error.message)) {
      return NextResponse.json({ ok: false, message: PESAN_KOLOM_HILANG }, { status: 500 });
    }
    if (/duplicate|unique/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, message: "NISN ini sudah digunakan akun lain." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan NISN. Coba lagi sebentar lagi." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "NISN berhasil dikirim. Tunggu verifikasi dari admin.",
    verification_status: "menunggu",
  });
}

/* ================= PUT : admin verifikasi / tolak ======================== */
export async function PUT(request: Request) {
  const admin = buatAdminClient();
  const auth = await wajibAdminGuru(admin);
  if ("error" in auth) return auth.error;

  let body: { id?: string; aksi?: string; catatan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }

  const id = String(body.id ?? "").trim();
  const aksi = String(body.aksi ?? "").trim();
  const catatan = String(body.catatan ?? "").trim();

  if (!id) {
    return NextResponse.json({ ok: false, message: "ID pengguna tidak ditemukan." }, { status: 400 });
  }
  if (aksi !== "verifikasi" && aksi !== "tolak") {
    return NextResponse.json(
      { ok: false, message: "Aksi harus 'verifikasi' atau 'tolak'." },
      { status: 400 }
    );
  }
  if (catatan.length > 300) {
    return NextResponse.json(
      { ok: false, message: "Catatan terlalu panjang (maksimal 300 karakter)." },
      { status: 400 }
    );
  }

  const { data: target, error: errTarget } = await admin
    .from("users")
    .select("id, nama, nisn, verification_status")
    .eq("id", id)
    .maybeSingle();

  if (errTarget) {
    console.error("[verifikasi] gagal baca pengguna:", errTarget.message);
    return NextResponse.json(
      { ok: false, message: "Gagal membaca data pengguna." },
      { status: 500 }
    );
  }
  if (!target) {
    return NextResponse.json(
      { ok: false, message: "Pengguna tidak ditemukan." },
      { status: 404 }
    );
  }
  if (!target.nisn) {
    return NextResponse.json(
      { ok: false, message: "Pengguna ini belum mengirim NISN." },
      { status: 400 }
    );
  }

  const sekarang = new Date().toISOString();
  const perubahan =
    aksi === "verifikasi"
      ? {
          verification_status: "terverifikasi",
          verification_note: null,
          verified_at: sekarang,
          verified_by: auth.user.id,
        }
      : {
          verification_status: "ditolak",
          verification_note: catatan || null,
          verified_at: sekarang,
          verified_by: auth.user.id,
        };

  const { error } = await admin.from("users").update(perubahan).eq("id", id);

  if (error) {
    console.error("[verifikasi] gagal update status:", error.message);
    if (galatKolomHilang(error.message)) {
      return NextResponse.json({ ok: false, message: PESAN_KOLOM_HILANG }, { status: 500 });
    }
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan keputusan verifikasi." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      aksi === "verifikasi"
        ? `${target.nama ?? "Pengguna"} berhasil diverifikasi sebagai pelajar.`
        : `${target.nama ?? "Pengguna"} ditolak verifikasinya.`,
    verification_status: perubahan.verification_status,
  });
}
