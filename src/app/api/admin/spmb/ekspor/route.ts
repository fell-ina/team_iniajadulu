import ExcelJS from "exceljs";
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
} from "@/lib/spmb-admin";

/**
 * app/api/admin/spmb/ekspor/route.ts
 * ---------------------------------------------------------------------------
 * Unduh daftar pendaftar SPMB sebagai tabel Excel (.xlsx).
 *
 *   GET ?jurusan=PPLG|TJKT|DKV|TKR|semua
 *       &status=diterima|ditolak|menunggu|semua
 *       &q=kata-pencarian
 *
 * Tab jurusan di panel admin mengirim `jurusan` yang sedang dibuka, sehingga
 * file berisi peserta jurusan tersebut saja; tombol ekspor di dalamnya memilih
 * status (diterima / ditolak / semua).
 *
 * Hanya role admin. Data dibaca dengan service role karena RLS tabel tanpa
 * policy. Jenis kelamin, pilihan jurusan, dan status ditulis dalam bahasa
 * Indonesia agar langsung bisa dibagikan ke panitia.
 * ---------------------------------------------------------------------------
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UKURAN_HALAMAN = 1000;
const MAKS_BARIS = 50000;

interface PendaftarEkspor {
  nama: string;
  email: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  asal_sekolah: string;
  alamat: string;
  no_hp: string;
  jurusan_1: string;
  jurusan_2: string;
  nama_wali: string;
  no_hp_wali: string;
  status: string;
  status_diubah_at: string | null;
  created_at: string;
}

function labelStatus(status: string) {
  if (status === "diterima") return "Diterima";
  if (status === "ditolak") return "Ditolak";
  return "Menunggu";
}

/** "2010-08-12" -> Date UTC tengah malam (exceljs menulis tanggal apa adanya). */
function tanggalLahir(iso: string): Date | null {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!cocok) return null;
  const tanggal = new Date(
    Date.UTC(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3]))
  );
  return Number.isNaN(tanggal.getTime()) ? null : tanggal;
}

/**
 * Timestamp dari database (UTC) digeser ke WIB supaya jam di Excel sama dengan
 * jam yang tampil di panel admin.
 */
function waktuWib(iso: string | null): Date | null {
  if (!iso) return null;
  const waktu = new Date(iso);
  if (Number.isNaN(waktu.getTime())) return null;
  return new Date(waktu.getTime() + 7 * 60 * 60 * 1000);
}

function namaBerkas(jurusan: string, status: string) {
  const hariIni = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return `spmb-${(jurusan === "semua" ? "semua-jurusan" : jurusan).toLowerCase()}-${status}-${hariIni}.xlsx`;
}

export async function GET(request: Request) {
  const admin = buatAdminClient();
  const auth = await wajibAdmin(admin);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);

  const q = bersihkanKataCari(searchParams.get("q") ?? "");

  const statusMinta = (searchParams.get("status") ?? "semua").trim().toLowerCase();
  const status = (STATUS_SPMB as readonly string[]).includes(statusMinta)
    ? statusMinta
    : "semua";

  const jurusanMinta = (searchParams.get("jurusan") ?? "semua").trim().toUpperCase();
  const jurusan =
    jurusanMinta === "SEMUA" || !jurusanValid(jurusanMinta) ? "semua" : jurusanMinta;

  // Ambil seluruh baris yang cocok (tanpa paginasi layar).
  const baris: PendaftarEkspor[] = [];
  let dari = 0;
  for (;;) {
    let query = admin
      .from(TABEL_SPMB)
      .select(KOLOM_SPMB)
      .order("nama", { ascending: true })
      .order("created_at", { ascending: true });

    if (q) query = query.or(kondisiCari(q));
    if (status !== "semua") query = query.eq("status", status);
    if (jurusan !== "semua") query = query.eq("jurusan_1", jurusan);

    const { data, error } = await query.range(dari, dari + UKURAN_HALAMAN - 1);
    if (error) return galatDatabase(error);

    const potongan = (data ?? []) as PendaftarEkspor[];
    baris.push(...potongan);

    if (potongan.length < UKURAN_HALAMAN || baris.length >= MAKS_BARIS) break;
    dari += UKURAN_HALAMAN;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Panel Admin SMK Telekomunikasi Tunas Harapan";
  workbook.created = new Date();

  const judulJurusan =
    jurusan === "semua"
      ? "Semua jurusan"
      : `${jurusan} — ${JURUSAN.find((j) => j.kode === jurusan)?.nama ?? jurusan}`;
  const judulStatus =
    status === "semua"
      ? "Semua status"
      : `Status: ${labelStatus(status)}`;

  const sheet = workbook.addWorksheet(`SPMB ${jurusan === "semua" ? "Semua" : jurusan}`, {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  });

  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama", key: "nama", width: 28 },
    { header: "Email", key: "email", width: 30 },
    { header: "Jenis Kelamin", key: "jenis_kelamin", width: 14 },
    { header: "Tempat Lahir", key: "tempat_lahir", width: 20 },
    { header: "Tanggal Lahir", key: "tanggal_lahir", width: 14 },
    { header: "Asal Sekolah", key: "asal_sekolah", width: 26 },
    { header: "Alamat Tempat Tinggal", key: "alamat", width: 40 },
    { header: "No. HP / WhatsApp", key: "no_hp", width: 18 },
    { header: "Pilihan Jurusan 1", key: "jurusan_1", width: 12 },
    { header: "Pilihan Jurusan 2", key: "jurusan_2", width: 12 },
    { header: "Nama Orang Tua / Wali", key: "nama_wali", width: 26 },
    { header: "No. HP / WA Wali", key: "no_hp_wali", width: 18 },
    { header: "Status", key: "status", width: 12 },
    { header: "Tanggal Daftar", key: "created_at", width: 18 },
    { header: "Tanggal Keputusan", key: "status_diubah_at", width: 18 },
  ];

  const kepala = sheet.getRow(1);
  kepala.font = { bold: true, color: { argb: "FFC1E8FF" }, size: 11 };
  kepala.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF052659" } };
  kepala.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  kepala.height = 30;

  const data = baris.map((item, i) => ({
    no: i + 1,
    nama: item.nama,
    email: item.email,
    jenis_kelamin: item.jenis_kelamin === "laki-laki" ? "Laki-laki" : "Perempuan",
    tempat_lahir: item.tempat_lahir,
    tanggal_lahir: tanggalLahir(item.tanggal_lahir),
    asal_sekolah: item.asal_sekolah,
    alamat: item.alamat,
    no_hp: item.no_hp,
    jurusan_1: item.jurusan_1,
    jurusan_2: item.jurusan_2,
    nama_wali: item.nama_wali,
    no_hp_wali: item.no_hp_wali,
    status: labelStatus(item.status),
    created_at: waktuWib(item.created_at),
    status_diubah_at: waktuWib(item.status_diubah_at),
  }));

  data.forEach((isi) => sheet.addRow(isi));

  sheet.getColumn("tanggal_lahir").numFmt = "dd/mm/yyyy";
  sheet.getColumn("created_at").numFmt = "dd/mm/yyyy hh:mm";
  sheet.getColumn("status_diubah_at").numFmt = "dd/mm/yyyy hh:mm";

  for (const kolom of ["no", "jenis_kelamin", "tanggal_lahir", "jurusan_1", "jurusan_2", "status"]) {
    sheet.getColumn(kolom).alignment = { horizontal: "center", vertical: "middle" };
  }
  for (const kolom of ["no_hp", "no_hp_wali"]) {
    sheet.getColumn(kolom).numFmt = "@";
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  };

  // Judul ringkas di atas tabel tidak dipakai supaya baris 1 tetap header yang
  // bisa langsung difilter/diurutkan di Excel; konteksnya ada di nama sheet.
  const keterangan = `${judulJurusan} · ${judulStatus} · diunduh ${new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  })}`;
  sheet.headerFooter.oddFooter = `&L${keterangan}&R Halaman &P dari &N`;

  const berkas = new Uint8Array(await workbook.xlsx.writeBuffer());

  return new NextResponse(berkas, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaBerkas(jurusan, status)}"`,
      "Content-Length": String(berkas.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
