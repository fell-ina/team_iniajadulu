import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { jurusanValid } from "@/lib/sekolah";

/**
 * app/api/admin/spmb/route.ts
 * ---------------------------------------------------------------------------
 * Panel seleksi pendaftar SPMB / PPDB untuk admin.
 *
 *  - GET  : daftar pendaftar + paginasi + pencarian + filter
 *           ?page=1&perPage=10&q=&status=menunggu|diterima|ditolak|semua
 *           &jurusan1=PPLG|TJKT|DKV|TKR|semua
 *           &jurusan2=PPLG|TJKT|DKV|TKR|semua
 *           &jk=laki-laki|perempuan|semua
 *           &urut=terbaru|nama&arah=asc|desc
 *  - POST : terima / tolak / batalkan pendaftar yang dicentang
 *           body JSON { aksi: "terima" | "tolak" | "menunggu", ids: string[] }
 *
 * Hanya role `admin` yang boleh memakai endpoint ini. Tabel memakai service
 * role karena RLS `spmb_pendaftar` sengaja tanpa policy (publik tidak boleh
 * membaca data pendaftar).
 * ---------------------------------------------------------------------------
 */

export const dynamic = "force-dynamic";

const TABEL = "spmb_pendaftar";
const KOLOM =
  "id, nama, email, jenis_kelamin, tempat_lahir, tanggal_lahir, asal_sekolah, alamat, no_hp, jurusan_1, jurusan_2, nama_wali, no_hp_wali, status, status_diubah_at, created_at";

const STATUS_VALID = ["menunggu", "diterima", "ditolak"] as const;
const JENIS_KELAMIN_VALID = ["laki-laki", "perempuan"] as const;
const URUT_VALID = ["nama", "terbaru"] as const;
const PER_PAGE_DIIZINKAN = [10, 25, 50];
const MAKS_ID_AKSI = 500;

type StatusSpmb = (typeof STATUS_VALID)[number];

const PESAN_MIGRASI =
  "Kolom status pendaftar belum ada. Jalankan supabase/migrations/20261025000001_add_spmb_status.sql di Supabase SQL Editor terlebih dahulu.";

type AdminClient = ReturnType<typeof buatAdminClient>;

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

/** Hanya admin yang boleh menyeleksi pendaftar. */
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
        { ok: false, message: "Hanya admin yang boleh menyeleksi pendaftar SPMB." },
        { status: 403 }
      ),
    } as const;
  }

  return { user } as const;
}

/**
 * Pesan yang jelas bila tabel / kolom status belum dibuat, supaya panitia
 * tidak melihat daftar kosong tanpa sebab.
 */
function galatDatabase(error: { code?: string; message?: string }) {
  const pesan = error.message ?? "";

  if (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /column .*status.* does not exist|status_diubah_at/i.test(pesan)
  ) {
    console.warn("[admin/spmb] kolom status belum ada:", pesan);
    return NextResponse.json({ ok: false, message: PESAN_MIGRASI }, { status: 503 });
  }

  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /relation .*spmb_pendaftar.* does not exist|Could not find the table/i.test(pesan)
  ) {
    console.warn("[admin/spmb] tabel spmb_pendaftar belum ada:", pesan);
    return NextResponse.json(
      {
        ok: false,
        message:
          "Tabel pendaftaran belum tersedia. Jalankan migrasi supabase/migrations/20261025000000_add_spmb_pendaftar.sql terlebih dahulu.",
      },
      { status: 503 }
    );
  }

  console.error("[admin/spmb] kesalahan database:", pesan);
  return NextResponse.json(
    { ok: false, message: "Terjadi kesalahan pada database. Coba lagi beberapa saat lagi." },
    { status: 500 }
  );
}

/** Buang karakter yang bermakna khusus pada filter PostgREST. */
function bersihkanKataCari(q: string) {
  return q.replace(/[%,()*"\\]/g, " ").trim();
}

function pilihKode(
  nilai: string | null,
  valid: (v: string) => boolean
) {
  const mentah = (nilai ?? "semua").trim().toUpperCase();
  if (!mentah || mentah === "SEMUA") return "semua";
  return valid(mentah) ? mentah : "semua";
}

interface FilterDaftar {
  q: string;
  status: string;
  jurusan1: string;
  jurusan2: string;
  jk: string;
}

/** Query dasar yang sudah memakai seluruh filter daftar. */
function saringDaftar(admin: AdminClient, f: FilterDaftar, kolom: string, hitung = false) {
  let query = admin
    .from(TABEL)
    .select(kolom, hitung ? { count: "exact", head: true } : { count: "exact" });

  if (f.q) {
    query = query.or(
      `nama.ilike.%${f.q}%,email.ilike.%${f.q}%,asal_sekolah.ilike.%${f.q}%,no_hp.ilike.%${f.q}%,no_hp_wali.ilike.%${f.q}%`
    );
  }
  if (f.status !== "semua") query = query.eq("status", f.status);
  if (f.jurusan1 !== "semua") query = query.eq("jurusan_1", f.jurusan1);
  if (f.jurusan2 !== "semua") query = query.eq("jurusan_2", f.jurusan2);
  if (f.jk !== "semua") query = query.eq("jenis_kelamin", f.jk);

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

  const statusMinta = (searchParams.get("status") ?? "semua").trim().toLowerCase();
  const status = (STATUS_VALID as readonly string[]).includes(statusMinta)
    ? statusMinta
    : "semua";

  const jurusan1 = pilihKode(searchParams.get("jurusan1"), jurusanValid);
  const jurusan2 = pilihKode(searchParams.get("jurusan2"), jurusanValid);

  const jkMinta = (searchParams.get("jk") ?? "semua").trim().toLowerCase();
  const jk = (JENIS_KELAMIN_VALID as readonly string[]).includes(jkMinta)
    ? jkMinta
    : "semua";

  const urutMinta = (searchParams.get("urut") ?? "terbaru").trim().toLowerCase();
  const urut = (URUT_VALID as readonly string[]).includes(urutMinta)
    ? urutMinta
    : "terbaru";
  const arah =
    (searchParams.get("arah") ?? (urut === "nama" ? "asc" : "desc")).trim().toLowerCase() ===
    "asc"
      ? "asc"
      : "desc";

  const filter: FilterDaftar = { q, status, jurusan1, jurusan2, jk };

  // Hitung dulu supaya nomor halaman bisa dijepit ke halaman terakhir: daftar
  // bisa menyusut setelah filter berubah atau pendaftar diputuskan.
  const hitung = await saringDaftar(admin, filter, "id", true);
  if (hitung.error) return galatDatabase(hitung.error);

  const total = hitung.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const halaman = Math.min(page, totalPages);
  const dari = (halaman - 1) * perPage;

  const { data, error } = await saringDaftar(admin, filter, KOLOM)
    .order(urut === "nama" ? "nama" : "created_at", { ascending: arah === "asc" })
    .range(dari, dari + perPage - 1);

  if (error) return galatDatabase(error);

  const [hitungTotal, hitungMenunggu, hitungDiterima, hitungDitolak] = await Promise.all([
    admin.from(TABEL).select("id", { count: "exact", head: true }),
    admin
      .from(TABEL)
      .select("id", { count: "exact", head: true })
      .eq("status", "menunggu"),
    admin
      .from(TABEL)
      .select("id", { count: "exact", head: true })
      .eq("status", "diterima"),
    admin
      .from(TABEL)
      .select("id", { count: "exact", head: true })
      .eq("status", "ditolak"),
  ]);

  const ringkasanError =
    hitungTotal.error ?? hitungMenunggu.error ?? hitungDiterima.error ?? hitungDitolak.error;

  if (ringkasanError) return galatDatabase(ringkasanError);

  return NextResponse.json({
    ok: true,
    page: halaman,
    perPage,
    total,
    totalPages,
    data: data ?? [],
    ringkasan: {
      total: hitungTotal.count ?? 0,
      menunggu: hitungMenunggu.count ?? 0,
      diterima: hitungDiterima.count ?? 0,
      ditolak: hitungDitolak.count ?? 0,
    },
  });
}

/* ====================== POST : terima / tolak massal ===================== */
const AKSI: Record<string, { status: StatusSpmb; label: string }> = {
  terima: { status: "diterima", label: "diterima" },
  tolak: { status: "ditolak", label: "ditolak" },
  menunggu: { status: "menunggu", label: "dikembalikan ke menunggu" },
};

export async function POST(request: Request) {
  const admin = buatAdminClient();
  const auth = await wajibAdmin(admin);
  if ("error" in auth) return auth.error;

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

  const isian = body as Record<string, unknown>;
  const aksi = typeof isian.aksi === "string" ? isian.aksi.trim().toLowerCase() : "";

  if (!AKSI[aksi]) {
    return NextResponse.json(
      { ok: false, message: "Aksi tidak dikenal. Gunakan terima, tolak, atau menunggu." },
      { status: 400 }
    );
  }

  const idsMentah = Array.isArray(isian.ids) ? isian.ids : [];
  const ids = Array.from(
    new Set(
      idsMentah.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    )
  );

  if (ids.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Pilih minimal satu pendaftar terlebih dahulu." },
      { status: 400 }
    );
  }

  if (ids.length > MAKS_ID_AKSI) {
    return NextResponse.json(
      {
        ok: false,
        message: `Maksimal ${MAKS_ID_AKSI} pendaftar sekali proses. Persempit pilihan Anda.`,
      },
      { status: 400 }
    );
  }

  const { status } = AKSI[aksi];

  const { data, error } = await admin
    .from(TABEL)
    .update({
      status,
      status_diubah_at: status === "menunggu" ? null : new Date().toISOString(),
    })
    .in("id", ids)
    .select("id");

  if (error) return galatDatabase(error);

  const jumlah = data?.length ?? 0;

  if (jumlah === 0) {
    return NextResponse.json(
      { ok: false, message: "Pendaftar yang dipilih tidak ditemukan. Muat ulang daftar." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    jumlah,
    message: `${jumlah} pendaftar ${AKSI[aksi].label}.`,
  });
}
