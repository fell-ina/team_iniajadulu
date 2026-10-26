import { NextResponse } from "next/server";
import { JURUSAN, jurusanValid } from "@/lib/sekolah";
import {
  KOLOM_SPMB,
  STATUS_SPMB,
  TABEL_SPMB,
  bersihkanKataCari,
  buatAdminClient,
  galatDatabase,
  kondisiCari,
  wajibAdmin,
  type AdminClient,
  type StatusSpmb,
} from "@/lib/spmb-admin";

/**
 * app/api/admin/spmb/route.ts
 * ---------------------------------------------------------------------------
 * Panel seleksi pendaftar SPMB / PPDB untuk admin.
 *
 *  - GET  : daftar pendaftar satu tab jurusan + paginasi + pencarian + status
 *           ?page=1&perPage=10&q=&jurusan=PPLG|TJKT|DKV|TKR|semua
 *           &status=menunggu|diterima|ditolak|semua
 *           &urut=terbaru|nama&arah=asc|desc
 *           Balasan menyertakan `ringkasan` jumlah pendaftar per status untuk
 *           tiap tab jurusan (mengikuti kata pencarian aktif).
 *  - POST : terima / tolak / batalkan pendaftar yang dicentang
 *           body JSON { aksi: "terima" | "tolak" | "menunggu", ids: string[] }
 *
 * Tab jurusan memakai pilihan jurusan 1 pendaftar (pilihan utama).
 *
 * Hanya role `admin` yang boleh memakai endpoint ini. Tabel memakai service
 * role karena RLS `spmb_pendaftar` sengaja tanpa policy (publik tidak boleh
 * membaca data pendaftar).
 * ---------------------------------------------------------------------------
 */

export const dynamic = "force-dynamic";

const URUT_VALID = ["nama", "terbaru"] as const;
const PER_PAGE_DIIZINKAN = [10, 25, 50];
const MAKS_ID_AKSI = 500;
const UKURAN_REKAP = 1000;

/** Jumlah pendaftar per status pada satu kelompok (semua / satu jurusan). */
interface AngkaStatus {
  total: number;
  menunggu: number;
  diterima: number;
  ditolak: number;
}

function angkaKosong(): AngkaStatus {
  return { total: 0, menunggu: 0, diterima: 0, ditolak: 0 };
}

function tambahAngka(angka: AngkaStatus, status: string) {
  angka.total += 1;
  if (status === "diterima") angka.diterima += 1;
  else if (status === "ditolak") angka.ditolak += 1;
  else angka.menunggu += 1;
}

function pilihKode(nilai: string | null, valid: (v: string) => boolean) {
  const mentah = (nilai ?? "semua").trim().toUpperCase();
  if (!mentah || mentah === "SEMUA") return "semua";
  return valid(mentah) ? mentah : "semua";
}

interface FilterDaftar {
  q: string;
  status: string;
  jurusan: string;
}

/** Query dasar daftar: pencarian + status + tab jurusan 1. */
function saringDaftar(admin: AdminClient, f: FilterDaftar) {
  let query = admin.from(TABEL_SPMB).select(KOLOM_SPMB, { count: "exact" });

  if (f.q) query = query.or(kondisiCari(f.q));
  if (f.status !== "semua") query = query.eq("status", f.status);
  if (f.jurusan !== "semua") query = query.eq("jurusan_1", f.jurusan);

  return query;
}

/**
 * Rekap jumlah pendaftar per jurusan (pilihan 1) dan per status, mengikuti kata
 * pencarian aktif tetapi tidak mengikuti tab/status yang sedang dipilih — jadi
 * angka di tab dan chip tidak pernah ikut mengecil saat filter dipakai.
 *
 * Data diambil bertahap 1000 baris agar tetap benar walau pendaftar banyak.
 */
async function hitungRingkasan(admin: AdminClient, q: string) {
  const ringkasan: Record<string, AngkaStatus> = { semua: angkaKosong() };
  for (const j of JURUSAN) ringkasan[j.kode] = angkaKosong();

  let dari = 0;
  for (;;) {
    let query = admin.from(TABEL_SPMB).select("jurusan_1, status").order("id");
    if (q) query = query.or(kondisiCari(q));

    const { data, error } = await query.range(dari, dari + UKURAN_REKAP - 1);
    if (error) return { ok: false as const, error };

    const baris = data ?? [];
    for (const item of baris) {
      tambahAngka(ringkasan.semua, item.status);
      const perJurusan = ringkasan[item.jurusan_1];
      if (perJurusan) tambahAngka(perJurusan, item.status);
    }

    if (baris.length < UKURAN_REKAP) break;
    dari += UKURAN_REKAP;
    // Pengaman: rekap tidak boleh berputar tanpa akhir.
    if (dari >= 50000) break;
  }

  return { ok: true as const, ringkasan };
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
  const status = (STATUS_SPMB as readonly string[]).includes(statusMinta)
    ? statusMinta
    : "semua";

  const jurusan = pilihKode(searchParams.get("jurusan"), jurusanValid);

  const urutMinta = (searchParams.get("urut") ?? "terbaru").trim().toLowerCase();
  const urut = (URUT_VALID as readonly string[]).includes(urutMinta)
    ? urutMinta
    : "terbaru";
  const arah =
    (searchParams.get("arah") ??
      (urut === "nama" ? "asc" : "desc")).trim().toLowerCase() === "asc"
      ? "asc"
      : "desc";

  const filter: FilterDaftar = { q, status, jurusan };

  // Hitung dulu supaya nomor halaman bisa dijepit ke halaman terakhir: daftar
  // bisa menyusut setelah tab / status berubah atau pendaftar diputuskan.
  let hitung = admin.from(TABEL_SPMB).select("id", { count: "exact", head: true });
  if (filter.q) hitung = hitung.or(kondisiCari(filter.q));
  if (filter.status !== "semua") hitung = hitung.eq("status", filter.status);
  if (filter.jurusan !== "semua") hitung = hitung.eq("jurusan_1", filter.jurusan);

  const { count, error: errorHitung } = await hitung;
  if (errorHitung) return galatDatabase(errorHitung);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const halaman = Math.min(page, totalPages);
  const dari = (halaman - 1) * perPage;

  const { data, error } = await saringDaftar(admin, filter)
    .order(urut === "nama" ? "nama" : "created_at", { ascending: arah === "asc" })
    .range(dari, dari + perPage - 1);

  if (error) return galatDatabase(error);

  const rekap = await hitungRingkasan(admin, q);
  if (!rekap.ok) return galatDatabase(rekap.error);

  return NextResponse.json({
    ok: true,
    page: halaman,
    perPage,
    total,
    totalPages,
    data: data ?? [],
    ringkasan: rekap.ringkasan,
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
    .from(TABEL_SPMB)
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
