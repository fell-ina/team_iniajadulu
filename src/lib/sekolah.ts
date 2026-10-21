/**
 * src/lib/sekolah.ts
 * ---------------------------------------------------------------------------
 * Daftar jurusan & kelas yang boleh dipilih siswa saat melengkapi data akun.
 * Dipakai bersama oleh halaman (/register/lengkapi) dan API (/api/auth/lengkapi)
 * supaya pilihan di UI dan validasi di server tidak pernah berbeda.
 *
 * Berkas ini murni (tanpa import server) sehingga aman dipakai di client.
 */

export const JURUSAN = [
  {
    kode: "PPLG",
    nama: "Pengembangan Perangkat Lunak dan Gim",
    ket: "Pemrograman, aplikasi, & gim",
  },
  {
    kode: "TJKT",
    nama: "Teknik Jaringan Komputer dan Telekomunikasi",
    ket: "Jaringan, server, & telekomunikasi",
  },
  {
    kode: "DKV",
    nama: "Desain Komunikasi Visual",
    ket: "Desain grafis, ilustrasi, & media",
  },
  {
    kode: "TKR",
    nama: "Teknik Kendaraan Ringan",
    ket: "Otomotif kendaraan ringan",
  },
] as const;

export const KELAS = [
  { kode: "X", nama: "Kelas X", ket: "Tingkat 10" },
  { kode: "XI", nama: "Kelas XI", ket: "Tingkat 11" },
  { kode: "XII", nama: "Kelas XII", ket: "Tingkat 12" },
] as const;

export type KodeJurusan = (typeof JURUSAN)[number]["kode"];
export type KodeKelas = (typeof KELAS)[number]["kode"];

export function jurusanValid(nilai: unknown): nilai is KodeJurusan {
  return JURUSAN.some((j) => j.kode === nilai);
}

export function kelasValid(nilai: unknown): nilai is KodeKelas {
  return KELAS.some((k) => k.kode === nilai);
}
