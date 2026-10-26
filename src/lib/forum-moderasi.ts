import { buatAdmin } from "@/lib/dashboard";
import { petaNama } from "@/lib/forum-server";
import type {
  KelasForum,
  LaporanForum,
  StatusLaporanForum,
} from "@/lib/forum-types";

/**
 * src/lib/forum-moderasi.ts
 * ---------------------------------------------------------------------------
 * Helper server-only untuk halaman Moderasi Forum di dashboard admin.
 *
 * Membaca public.forum_laporan apa adanya (tanpa mengubah skema) lalu
 * melengkapinya dengan nama pelapor serta judul/isi target laporan memakai
 * client service role, karena policy RLS forum_topik/forum_balasan hanya
 * mengizinkan siswa membaca topik kelasnya sendiri.
 *
 * Berkas ini hanya membaca laporan; perubahan status ditangani endpoint
 * PATCH /api/admin/forum/laporan/[id]. Tabel bisa saja belum dibuat di
 * database; kegagalan dikembalikan sebagai pesan agar halaman tetap tampil.
 * ---------------------------------------------------------------------------
 */

type BarisLaporan = {
  id: string;
  user_id: string;
  topik_id: string | null;
  balasan_id: string | null;
  alasan: string;
  status: string;
  created_at: string;
};

type TopikRingkas = {
  id: string;
  judul: string;
  kelas: string | null;
  konten?: string;
};

type BalasanRingkas = {
  id: string;
  topik_id: string;
  konten: string;
};

const STATUS_SAH: StatusLaporanForum[] = [
  "pending",
  "diproses",
  "selesai",
  "ditolak",
];

function kelasSah(nilai: string | null | undefined): KelasForum | null {
  return nilai === "X" || nilai === "XI" || nilai === "XII" ? nilai : null;
}

function statusSah(nilai: string): StatusLaporanForum {
  return (STATUS_SAH as string[]).includes(nilai)
    ? (nilai as StatusLaporanForum)
    : "pending";
}

export interface HasilLaporanForum {
  laporan: LaporanForum[];
  /** Pesan untuk admin bila tabel/kueri laporan tidak bisa dibaca. */
  galat: string | null;
}

export async function ambilLaporanForum(): Promise<HasilLaporanForum> {
  const admin = buatAdmin();

  const { data, error } = await admin
    .from("forum_laporan")
    .select("id, user_id, topik_id, balasan_id, alasan, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.warn("[moderasi forum] gagal membaca laporan:", error.message);
    return {
      laporan: [],
      galat:
        "Daftar laporan forum belum bisa dimuat dari database. Pastikan migrasi tabel forum sudah dijalankan.",
    };
  }

  const baris = (data ?? []) as BarisLaporan[];
  if (baris.length === 0) return { laporan: [], galat: null };

  const topikLangsungIds = [
    ...new Set(baris.map((b) => b.topik_id).filter((id): id is string => Boolean(id))),
  ];
  const balasanIds = [
    ...new Set(baris.map((b) => b.balasan_id).filter((id): id is string => Boolean(id))),
  ];

  // Target topik laporan.
  let topikLangsung: TopikRingkas[] = [];
  if (topikLangsungIds.length > 0) {
    const { data: topik, error: galatTopik } = await admin
      .from("forum_topik")
      .select("id, judul, kelas, konten")
      .in("id", topikLangsungIds);

    if (galatTopik) {
      console.warn("[moderasi forum] gagal membaca topik laporan:", galatTopik.message);
    } else {
      topikLangsung = (topik ?? []) as TopikRingkas[];
    }
  }

  // Target balasan laporan.
  let balasan: BalasanRingkas[] = [];
  if (balasanIds.length > 0) {
    const { data: isiBalasan, error: galatBalasan } = await admin
      .from("forum_balasan")
      .select("id, topik_id, konten")
      .in("id", balasanIds);

    if (galatBalasan) {
      console.warn("[moderasi forum] gagal membaca balasan laporan:", galatBalasan.message);
    } else {
      balasan = (isiBalasan ?? []) as BalasanRingkas[];
    }
  }

  // Topik induk dari balasan yang dilaporkan (judul + kelas untuk tautan detail).
  const topikIndukIds = [...new Set(balasan.map((b) => b.topik_id))];
  let topikInduk: TopikRingkas[] = [];
  if (topikIndukIds.length > 0) {
    const { data: topik, error: galatInduk } = await admin
      .from("forum_topik")
      .select("id, judul, kelas")
      .in("id", topikIndukIds);

    if (galatInduk) {
      console.warn("[moderasi forum] gagal membaca topik induk:", galatInduk.message);
    } else {
      topikInduk = (topik ?? []) as TopikRingkas[];
    }
  }

  const nama = await petaNama(baris.map((b) => b.user_id));

  const petaTopik = new Map<string, TopikRingkas>();
  for (const t of [...topikLangsung, ...topikInduk]) petaTopik.set(t.id, t);

  const petaBalasan = new Map(balasan.map((b) => [b.id, b]));

  const laporan: LaporanForum[] = baris.map((b) => {
    const balasanDilaporkan = b.balasan_id ? petaBalasan.get(b.balasan_id) : undefined;
    const topikId = b.topik_id ?? balasanDilaporkan?.topik_id ?? null;
    const topik = topikId ? petaTopik.get(topikId) : undefined;

    return {
      id: b.id,
      alasan: b.alasan,
      status: statusSah(b.status),
      createdAt: b.created_at,
      pelaporNama: nama.get(b.user_id) ?? "Pengguna",
      target: b.topik_id ? "topik" : "balasan",
      targetId: (b.topik_id ?? b.balasan_id) as string,
      targetKonten: b.topik_id ? topik?.konten ?? "" : balasanDilaporkan?.konten ?? "",
      topikId,
      topikJudul: topik?.judul ?? null,
      topikKelas: kelasSah(topik?.kelas),
    };
  });

  return { laporan, galat: null };
}
