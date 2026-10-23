# Foto Fasilitas

Semua foto untuk carousel **Fasilitas** di halaman depan (`src/app/page.tsx`, fungsi `Facilities()`) ada di folder ini.

## Spesifikasi foto

| Atribut | Nilai |
| --- | --- |
| Rasio | **16:10** (horisontal) |
| Resolusi | **1600 × 1000 px** |
| Format | `.jpg` (WebP juga boleh) |
| Ukuran file | di bawah **300 KB** |
| Nama file | `kebab-case`, sesuai tabel di bawah |

Alasan spesifikasinya: kartu memakai `aspect-[16/10]` dengan lebar maksimum 520 px dan ada efek `hover:scale-105`, sedangkan modal detail memakai `aspect-[16/9]` dengan lebar maksimum 512 px. 1600 px sudah menutup 2× retina di keduanya, dan `object-cover` akan memotong bagian excess di tengah — jadi foto dengan rasio berbeda tetap aman, hanya bagian sisinya yang terpotong.

## Daftar file

| # | Fasilitas | Nama file | Status |
| --- | --- | --- | --- |
| 01 | TEFA | `tefa.jpg` | ✅ sudah ada |
| 02 | Perpustakaan | `perpustakaan.png` | ✅ sudah ada |
| 03 | Telsa TV | `telsa-tv.png` | ✅ sudah ada |
| 04 | Asrama Putra | `asrama-putra.jpg` | ✅ sudah ada |
| 05 | Asrama Putri | `asrama-putri.jpg` | ✅ sudah ada |
| 06 | Lapangan Basket Atap | `lapangan-basket-atap.jpg` | ⬜️ belum ada — masih pakai foto lain |
| 07 | Lapangan Rumput | `lapangan-rumput.jpg` | ✅ sudah ada |
| 08 | Masjid | `masjid.png` | ✅ sudah ada |
| 09 | Toilet | `toilet.png` | ✅ sudah ada |
| 10 | Parkiran | `parkiran.png` | ✅ sudah ada |
| 11 | Aula | `aula.jpg` | ⬜️ belum ada — sedang tampil `placeholder.svg` |
| 12 | Lab & Bengkel Praktik | `lab-bengkel.png` | ✅ sudah ada |
| 13 | Kantin | `kantin.png` | ✅ sudah ada |
| 14 | UKS | `uks.png` | ✅ sudah ada |

## Cara memasang foto baru

1. Simpan foto ke folder ini memakai nama file pada tabel.
2. Ubah nilai `image` dan `imageAlt` untuk item terkait di `src/app/page.tsx` (fungsi `Facilities()`, array `items`).
3. Hapus komentar `// TODO:` di item tersebut.

## Catatan

- `placeholder.svg` dipakai otomatis untuk item yang fotonya belum tersedia. Jangan dihapus.
- Folder `../school/` masih dipakai oleh bagian lain (Jurusan, Berita, Hero), jadi file di sana tidak dihapus meski sudah disalin ke sini.
- `page_full.txt` di root repository adalah file lama yang tidak terpakai — abaikan.