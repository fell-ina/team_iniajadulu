import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { jurusanValid, kelasValid } from "@/lib/sekolah";

/**
 * app/api/admin/pengguna/route.ts
 * ---------------------------------------------------------------------------
 * Manajemen pengguna untuk dashboard admin (password TIDAK bisa diubah).
 *
 *  - GET   : daftar pengguna + paginasi + pencarian + filter role
 *            ?page=1&perPage=10&q=&role=siswa|guru|admin|semua
 *  - PATCH : ubah data satu pengguna
 *            body JSON { id, nama?, nisn?, jurusan?, kelas?, role? }
 *  - POST  : aksi massal untuk pengguna yang dicentang
 *            body JSON { aksi: "naikkan-kelas" | "hapus", ids: string[] }
 *
 * Hanya role `admin` yang boleh memakai endpoint ini. Akun sendiri tidak
 * bisa diturunkan rolenya atau dihapus, dan admin terakhir tidak bisa hilang.
 *
 * Kolom jurusan/kelas berasal dari
 * supabase/migrations/20261021000000_add_jurusan_kelas.sql. Bila migrasi belum
 * dijalankan, daftar tetap tampil tanpa kolom tersebut (mode terbatas).
 * ---------------------------------------------------------------------------
 */

type AdminClient = ReturnType<typeof buatAdminClient>;

interface BarisDaftar {
  id: string;
  nama: string | null;
  role: string | null;
  nisn: string | null;
  verification_status: string | null;
  jurusan?: string | null;
  kelas?: string | null;
}

const ROLE_VALID = ["siswa", "guru", "admin"] as const;
const NISN_REGEX = /^\d{10}$/;
const PER_PAGE_DIIZINKAN = [10, 25, 50];
const KOLOM_DASAR = "id, nama, role, nisn, verification_status";
const KOLOM_LENGKAP = `${KOLOM_DASAR}, jurusan, kelas`;

const PESAN_KOLOM_HILANG =
  "Kolom jurusan/kelas belum ada di tabel users. Jalankan supabase/migrations/20261021000000_add_jurusan_kelas.sql di Supabase SQL Editor terlebih dahulu.";

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

/** Hanya admin yang boleh mengelola pengguna. */
async function wajibAdmin(admin: AdminClient) {
  const supabase = await buatSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  if (profil?.role !== "admin") {
    return {
      error: NextResponse.json(
        { ok: false, message: "Hanya admin yang boleh mengelola data pengguna." },
        { status: 403 }
      ),
    } as const;
  }

  return { user } as const;
}

function galatKolomHilang(pesan: string) {
  return /jurusan|kelas|schema cache/i.test(pesan);
}

/** Peta id -> email dari Supabase Auth (tabel users tidak menyimpan email). */
async function petaEmail(admin: AdminClient): Promise<Record<string, string>> {
  const peta: Record<string, string> = {};
  try {
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data?.users?.length) break;
      data.users.forEach((u) => {
        if (u.id) peta[u.id] = u.email ?? "";
      });
      if (data.users.length < 1000) break;
    }
  } catch {
    /* email hanya pelengkap tampilan */
  }
  return peta;
}

function bersihkanKataCari(q: string) {
  // Buang karakter yang bermakna khusus pada filter PostgREST.
  return q.replace(/[%,()*"\\]/g, " ").trim();
}

function susunQuery(admin: AdminClient, kolom: string, q: string, role: string, dari: number, sampai: number) {
  let query = admin
    .from("users")
    .select(kolom, { count: "exact" })
    .order("nama", { ascending: true })
    .range(dari, sampai);

  if (q) query = query.or(`nama.ilike.%${q}%,nisn.ilike.%${q}%`);
  if (role !== "semua") query = query.eq("role", role);
  return query;
}

/* ============================== GET : daftar ============================= */
export async function GET(request: Request) {
  const admin = buatAdminClient();
  const auth = await wajibAdmin(admin);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const pageMinta = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(pageMinta) && pageMinta > 0 ? pageMinta : 1;
  const perPageMinta = Number.parseInt(searchParams.get("perPage") ?? "10", 10);
  const perPage = PER_PAGE_DIIZINKAN.includes(perPageMinta) ? perPageMinta : 10;
  const q = bersihkanKataCari(searchParams.get("q") ?? "");
  const roleMinta = (searchParams.get("role") ?? "semua").trim();
  const role = (ROLE_VALID as readonly string[]).includes(roleMinta) ? roleMinta : "semua";

  const dari = (page - 1) * perPage;
  const sampai = dari + perPage - 1;

  let lengkap = true;
  let { data, error, count } = await susunQuery(admin, KOLOM_LENGKAP, q, role, dari, sampai);

  if (error && galatKolomHilang(error.message)) {
    lengkap = false;
    const cadangan = await susunQuery(admin, KOLOM_DASAR, q, role, dari, sampai);
    data = cadangan.data;
    error = cadangan.error;
    count = cadangan.count;
  }

  if (error) {
    console.error("[admin/pengguna] gagal ambil daftar:", error.message);
    return NextResponse.json(
      { ok: false, message: "Gagal memuat daftar pengguna." },
      { status: 500 }
    );
  }

  const total = count ?? 0;
  const email = await petaEmail(admin);

  const [hitungSiswa, hitungGuru, hitungAdmin, hitungMenunggu] = await Promise.all([
    admin.from("users").select("id", { count: "exact", head: true }).eq("role", "siswa"),
    admin.from("users").select("id", { count: "exact", head: true }).eq("role", "guru"),
    admin.from("users").select("id", { count: "exact", head: true }).eq("role", "admin"),
    admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "menunggu"),
  ]);

  return NextResponse.json({
    ok: true,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    lengkap,
    data: ((data ?? []) as unknown as BarisDaftar[]).map((row) => ({
      jurusan: null,
      kelas: null,
      ...row,
      email: email[String(row.id)] ?? null,
    })),
    ringkasan: {
      total: (hitungSiswa.count ?? 0) + (hitungGuru.count ?? 0) + (hitungAdmin.count ?? 0),
      siswa: hitungSiswa.count ?? 0,
      guru: hitungGuru.count ?? 0,
      admin: hitungAdmin.count ?? 0,
      menunggu: hitungMenunggu.count ?? 0,
    },
  });
}

/* ============================ PATCH : ubah =============================== */
export async function PATCH(request: Request) {
  const admin = buatAdminClient();
  const auth = await wajibAdmin(admin);
  if ("error" in auth) return auth.error;

  let body: {
    id?: string;
    nama?: unknown;
    nisn?: unknown;
    jurusan?: unknown;
    kelas?: unknown;
    role?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }

  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "ID pengguna tidak ditemukan." },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {};

  if (body.nama !== undefined) {
    const nama = String(body.nama ?? "").trim();
    if (!nama) {
      return NextResponse.json({ ok: false, message: "Nama wajib diisi." }, { status: 400 });
    }
    if (nama.length > 120) {
      return NextResponse.json(
        { ok: false, message: "Nama terlalu panjang (maksimal 120 karakter)." },
        { status: 400 }
      );
    }
    payload.nama = nama;
  }

  if (body.nisn !== undefined) {
    const nisn = String(body.nisn ?? "").replace(/\s+/g, "").trim();
    if (nisn && !NISN_REGEX.test(nisn)) {
      return NextResponse.json(
        { ok: false, message: "NISN harus terdiri dari 10 angka (atau kosongkan)." },
        { status: 400 }
      );
    }
    payload.nisn = nisn || null;
  }

  if (body.jurusan !== undefined) {
    const jurusan = String(body.jurusan ?? "").trim().toUpperCase();
    if (jurusan && !jurusanValid(jurusan)) {
      return NextResponse.json({ ok: false, message: "Jurusan tidak valid." }, { status: 400 });
    }
    payload.jurusan = jurusan || null;
  }

  if (body.kelas !== undefined) {
    const kelas = String(body.kelas ?? "").trim().toUpperCase();
    if (kelas && !kelasValid(kelas)) {
      return NextResponse.json({ ok: false, message: "Kelas tidak valid." }, { status: 400 });
    }
    payload.kelas = kelas || null;
  }

  let roleBaru: string | null = null;
  if (body.role !== undefined) {
    const role = String(body.role ?? "").trim();
    if (!(ROLE_VALID as readonly string[]).includes(role)) {
      return NextResponse.json({ ok: false, message: "Role tidak valid." }, { status: 400 });
    }
    if (id === auth.user.id && role !== "admin") {
      return NextResponse.json(
        { ok: false, message: "Anda tidak bisa menurunkan role akun sendiri." },
        { status: 400 }
      );
    }
    payload.role = role;
    roleBaru = role;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(
      { ok: false, message: "Tidak ada data yang diubah." },
      { status: 400 }
    );
  }

  const { data: target, error: errTarget } = await admin
    .from("users")
    .select("id, nama, role")
    .eq("id", id)
    .maybeSingle();

  if (errTarget) {
    return NextResponse.json(
      { ok: false, message: "Gagal membaca data pengguna." },
      { status: 500 }
    );
  }
  if (!target) {
    return NextResponse.json({ ok: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  // Jangan sampai admin terakhir hilang dari sistem.
  if (target.role === "admin" && roleBaru && roleBaru !== "admin") {
    const { data: adminLain, error: errAdmin } = await admin
      .from("users")
      .select("id")
      .eq("role", "admin")
      .neq("id", id)
      .limit(1);

    if (errAdmin) {
      return NextResponse.json(
        { ok: false, message: "Gagal memeriksa jumlah admin." },
        { status: 500 }
      );
    }
    if (!adminLain || adminLain.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Tidak bisa mengubah role admin terakhir." },
        { status: 400 }
      );
    }
  }

  const { error } = await admin.from("users").update(payload).eq("id", id);

  // Kolom jurusan/kelas belum ada -> beri pesan migrasi yang jelas.
  if (error && galatKolomHilang(error.message)) {
    return NextResponse.json({ ok: false, message: PESAN_KOLOM_HILANG }, { status: 500 });
  }

  if (error) {
    console.error("[admin/pengguna] gagal update:", error.message);
    if (/duplicate|unique/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, message: "NISN ini sudah dipakai akun lain." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan perubahan." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Data pengguna berhasil diperbarui." });
}

/* ========================= POST : aksi massal =========================== */
export async function POST(request: Request) {
  const admin = buatAdminClient();
  const auth = await wajibAdmin(admin);
  if ("error" in auth) return auth.error;

  let body: { aksi?: string; ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }

  const aksi = String(body.aksi ?? "").trim();
  if (aksi !== "naikkan-kelas" && aksi !== "hapus") {
    return NextResponse.json(
      { ok: false, message: "Aksi harus 'naikkan-kelas' atau 'hapus'." },
      { status: 400 }
    );
  }

  const ids = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.map((v) => String(v ?? "").trim()).filter(Boolean)))
    : [];

  if (ids.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Pilih minimal satu pengguna terlebih dahulu." },
      { status: 400 }
    );
  }
  if (ids.length > 500) {
    return NextResponse.json(
      { ok: false, message: "Maksimal 500 pengguna dalam satu aksi." },
      { status: 400 }
    );
  }

  if (aksi === "naikkan-kelas") {
    const { data: baris, error } = await admin
      .from("users")
      .select("id, role, kelas")
      .in("id", ids);

    if (error) {
      console.error("[admin/pengguna] gagal baca kelas:", error.message);
      if (galatKolomHilang(error.message)) {
        return NextResponse.json({ ok: false, message: PESAN_KOLOM_HILANG }, { status: 500 });
      }
      return NextResponse.json(
        { ok: false, message: "Gagal membaca data kelas." },
        { status: 500 }
      );
    }

    const daftar = (baris ?? []) as { id: string; role: string | null; kelas: string | null }[];
    const tidakSiswa = daftar.filter((b) => b.role !== "siswa").length;
    const tanpaKelas = daftar.filter((b) => b.role === "siswa" && !b.kelas).length;
    const perluNaik = daftar.filter(
      (b) => b.role === "siswa" && (b.kelas === "X" || b.kelas === "XI")
    );

    let diubah = 0;
    for (const b of perluNaik) {
      const baru = b.kelas === "X" ? "XI" : "XII";
      const { error: errUpdate } = await admin.from("users").update({ kelas: baru }).eq("id", b.id);
      if (!errUpdate) diubah += 1;
    }

    const sudahXII = daftar.filter((b) => b.role === "siswa" && b.kelas === "XII").length;
    let pesan = `${diubah} siswa dinaikkan kelasnya.`;
    if (sudahXII > 0) pesan += ` ${sudahXII} siswa sudah kelas XII dan dilewati.`;
    if (tanpaKelas > 0) pesan += ` ${tanpaKelas} siswa belum punya kelas.`;
    if (tidakSiswa > 0) pesan += ` ${tidakSiswa} akun bukan siswa dan dilewati.`;

    return NextResponse.json({
      ok: true,
      message: pesan,
      diubah,
      dilewati: sudahXII + tanpaKelas + tidakSiswa,
    });
  }

  // aksi === "hapus"
  if (ids.includes(auth.user.id)) {
    return NextResponse.json(
      { ok: false, message: "Anda tidak bisa menghapus akun sendiri." },
      { status: 400 }
    );
  }

  const { data: baris, error } = await admin.from("users").select("id, role, nama").in("id", ids);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "Gagal membaca data pengguna." },
      { status: 500 }
    );
  }

  const daftar = (baris ?? []) as { id: string; role: string | null; nama: string | null }[];
  if (daftar.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Pengguna tidak ditemukan." },
      { status: 404 }
    );
  }

  const akanHapusAdmin = daftar.filter((b) => b.role === "admin").length;
  if (akanHapusAdmin > 0) {
    const { data: semuaAdmin, error: errAdmin } = await admin
      .from("users")
      .select("id")
      .eq("role", "admin");

    if (errAdmin) {
      return NextResponse.json(
        { ok: false, message: "Gagal memeriksa jumlah admin." },
        { status: 500 }
      );
    }
    const tersisa = (semuaAdmin ?? []).filter((a) => !ids.includes(String(a.id))).length;
    if (tersisa === 0) {
      return NextResponse.json(
        { ok: false, message: "Tidak bisa menghapus semua admin." },
        { status: 400 }
      );
    }
  }

  // Urutannya penting: `public.users.id` mereferensikan `auth.users.id` tanpa
  // cascade, jadi baris profil harus dihapus DULU. Kalau akun Auth dihapus
  // lebih dulu, Supabase menolak dengan "Database error deleting user".
  const berhasil: string[] = [];
  const gagal: string[] = [];

  for (const b of daftar) {
    const id = String(b.id);
    const { error: errProfil } = await admin.from("users").delete().eq("id", id);

    if (errProfil) {
      console.warn("[admin/pengguna] gagal hapus profil:", id, errProfil.message);
      gagal.push(b.nama ?? id);
      continue;
    }

    const { error: errAuth } = await admin.auth.admin.deleteUser(id);
    if (errAuth && !/not found/i.test(errAuth.message)) {
      console.warn("[admin/pengguna] gagal hapus akun auth:", id, errAuth.message);
      gagal.push(b.nama ?? id);
      continue;
    }

    berhasil.push(id);
  }

  if (gagal.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: `${berhasil.length} pengguna dihapus, ${gagal.length} gagal (${gagal
          .slice(0, 3)
          .join(", ")}${gagal.length > 3 ? ", …" : ""}). Muat ulang daftar lalu coba lagi.`,
        dihapus: berhasil.length,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: `${berhasil.length} pengguna dihapus permanen.`,
    dihapus: berhasil.length,
  });
}

