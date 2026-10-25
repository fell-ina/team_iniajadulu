# 🏫 Website Profil Sekolah Interaktif - SMK Telekomunikasi Tunas Harapan

> **Proyek Kompetisi Web (Tahap Penyisihan)**  
> Platform sistem informasi profil sekolah modern berbasis Next.js 16, terintegrasi dengan Asisten Virtual AI "Fiska" dan visualisasi model 3D interaktif.

🌐 **Live Demo:** [https://team-iniajadulu.vercel.app/](https://team-iniajadulu.vercel.app/)

---

## 👥 Profil Tim

**Nama Tim:** Ini Aja Dulu  
**Asal Sekolah:** SMK Telekomunikasi Tunas Harapan  
**Anggota:**
1. Royan Felix
2. Abraham Rainhard
3. Felix Sutikno
4. Reyhan Eka
5. Muhammad Haikal Adzmy

---

## 📌 Fitur Utama

- **🤖 Asisten Virtual AI "Fiska":** Chatbot cerdas berbasis Groq LLM yang memanfaatkan teknik *strict grounding* pada berkas basis pengetahuan lokal untuk menjawab pertanyaan calon siswa/orang tua terkait PPDB, biaya, fasilitas, dan jurusan secara akurat 24/7.
- **🧊 Visualisasi 3D Interaktif:** Tampilan objek dan fasilitas jurusan 3D interaktif berbasis React Three Fiber & Drei yang dapat dirotasi $360^\circ$ dan di-zoom langsung di peramban.
- **📰 Portal Berita & CMS Mandiri:** Fitur manajemen berita mandiri (CRUD) khusus admin/guru yang terproteksi dengan autentikasi aman serta sistem penyimpanan *image bucket*.
- **⚡ Hero Slider & Quick Access:** Tampilan halaman utama responsif (*floating pill navbar*, slider otomatis 7 detik, dan akses cepat ke fasilitas utama seperti TEFA, Telsa TV, dan SPMB).
- **💼 Tracer Study & Kemitraan DUDI:** Visualisasi statistik kelulusan (*Kawal Kerja & Kawal Kuliah*) serta marquee dinamis untuk 9 mitra industri unggulan.
- **🔒 Secure Role-Based Authentication:** Pengamanan rute berbasis *Server-Side Rendering* (SSR) dan Supabase Auth menggunakan cookie `httpOnly`.

---

## 🛠️ Tech Stack

### Frontend & Backend Framework
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Library Utama:** React 19 + TypeScript
- **Styling & Animasi:** Tailwind CSS v4 + Framer Motion
- **Tipografi:** Geist + Space Grotesk

### Backend Services & Storage
- **Database & Auth:** Supabase SSR & Supabase Auth
- **File Storage:** Supabase Storage Bucket (Manajemen Gambar Berita)

### AI & Interactive 3D Engine
- **AI Chatbot:** Groq Cloud API (Groq LLM Engine)
- **3D Graphics:** React Three Fiber + Three.js + `@react-three/drei`

---

## 📂 Struktur Rute Halaman

```text
/                       - Halaman Utama (One-Page 7 Seksi: Profil, Jurusan, Berita, Fasilitas, DUDI, Prestasi, Footer)
/jurusan/[id]           - Halaman Detail Program Keahlian (PPLG, TJKT, DKV, TKR) & Model 3D Interaktif
/berita                 - Portal Berita Publik (Grid Berita, Pencarian, & Skeleton Loading)
/berita/[id]            - Halaman Pembacaan Artikel Berita (Format Markdown)
/spmb                   - Formulir SPMB / PPDB mandiri (terbuka untuk umum, tanpa akun)
/register               - Pendaftaran akun (email + Google) & verifikasi kode OTP
/register/lengkapi      - Pengisian nama, jurusan & kelas sebelum kode verifikasi dikirim
/login                  - Portal Autentikasi Login Admin / Guru / Siswa
/lupa-password          - Minta tautan reset kata sandi lewat email
/reset-password         - Isi kata sandi baru (dibuka dari tautan email)
/dashboard              - Ringkasan panel admin & guru (sidebar biru di kiri)
/dashboard/pengguna     - Kelola data pengguna (khusus admin)
/dashboard/spmb         - Terima / tolak pendaftar SPMB (khusus admin)
/dashboard/verifikasi   - Terima / tolak pengajuan NISN
/dashboard/berita       - Tambah, edit, & hapus berita (popup yang sama)
/admin/berita           - Rute lama, dialihkan ke /dashboard/berita
```

---

## ⚙️ Panduan Pengoperasian Lokal (Local Development)

### 1. Prasyarat System
- Node.js versi `v18.x` atau lebih baru
- `npm`, `pnpm`, atau `yarn`

### 2. Kloning Repositori
```bash
git clone https://github.com/username/repository-name.git
cd repository-name
```

### 3. Instalasi Dependensi
```bash
npm install
# atau
pnpm install
```

### 4. Pengaturan Environment Variable
Buat berkas `.env.local` di direktori utama dan isi kredensial berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

GROQ_API_KEY=your_groq_api_key
```

### 5. Jalankan Server Lokal
```bash
npm run dev
# atau
pnpm dev
```
Buka `http://localhost:3000` pada peramban Anda.

### 6. Mengaktifkan "Daftar / Masuk dengan Google"

Client ID & Client Secret Google **tidak disimpan di repo ini**, melainkan di Supabase:

1. Buka [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create Credentials → OAuth client ID → Web application**.
2. Tambahkan **Authorized redirect URI**: `https://<project-ref>.supabase.co/auth/v1/callback`
   (project-ref adalah bagian dari `NEXT_PUBLIC_SUPABASE_URL`).
3. Salin **Client ID** dan **Client Secret** ke Supabase Dashboard → **Authentication → Providers → Google** → aktifkan provider tersebut.
4. Di Supabase → **Authentication → URL Configuration**:
   - **Site URL** = domain produksi tanpa path, mis. `https://team-iniajadulu.vercel.app`
     (bukan URL deployment preview/branch).
   - **Redirect URLs** harus memuat path callback untuk **setiap** domain yang dipakai:
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/**
     https://team-iniajadulu.vercel.app/auth/callback
     https://team-iniajadulu.vercel.app/**
     https://*-fell-ina.vercel.app/**
     ```

   Kalau URL callback tidak ada di daftar itu, Supabase **mengabaikan** `redirectTo` dan
   mengembalikan kode ke *Site URL* apa adanya — gejalanya pengguna mendarat di
   `https://domain-anda/?code=...` alih-alih `.../auth/callback?code=...`. Sebagai jaring
   pengaman, `src/proxy.ts` meneruskan `?code=...` di path mana pun ke `/auth/callback`
   supaya session tetap bisa ditukar.

5. Pastikan build terbaru benar-benar ter-deploy di domain tersebut. Route
   `/api/auth/google` dan `/register/lengkapi` harus mengembalikan `200/307`, bukan `404`;
   kalau `404`, domain itu masih menyajikan build lama.

Alur kodenya: `src/components/TombolGoogle.tsx` → `src/app/api/auth/google/route.ts` → Google →
`src/app/auth/callback/route.ts` (membuat baris di tabel `users` dengan role `siswa`, lalu mengalihkan sesuai role).

### 7. Masuk dengan NISN (Pelajar Terverifikasi)

Pelajar yang pengajuan NISN-nya sudah **diverifikasi** admin/guru
(`users.verification_status = 'terverifikasi'`) dapat masuk di `/login` dengan mengetik
**10 digit NISN** pada kolom identitas, ditambah kata sandi akunnya.

Logikanya ada di `src/app/api/auth/login/route.ts`: kolom `users.nisn` dicari, status
verifikasi dipastikan `terverifikasi`, lalu email Supabase Auth milik akun itu dipakai untuk
login. Status `belum` / `menunggu` / `ditolak` akan ditolak dengan pesan yang sesuai.
NISN tidak menggantikan kata sandi — akun yang mendaftar lewat Google tetap harus memakai
tombol “Masuk dengan Google”.

### 8. Data Jurusan & Kelas Siswa

Setiap siswa **wajib** memilih jurusan dan kelas setelah membuat akun. Kode verifikasi email
baru dikirim setelah data ini tersimpan. Jalankan migrasi berikut (atau
`supabase/migrations/20261021000000_add_jurusan_kelas.sql`) di Supabase SQL Editor:

```sql
alter table public.users add column if not exists jurusan text;
alter table public.users add column if not exists kelas text;

alter table public.users drop constraint if exists users_jurusan_check;
alter table public.users add constraint users_jurusan_check
  check (jurusan is null or jurusan in ('PPLG', 'TJKT', 'DKV', 'TKR'));

alter table public.users drop constraint if exists users_kelas_check;
alter table public.users add constraint users_kelas_check
  check (kelas is null or kelas in ('X', 'XI', 'XII'));

create index if not exists users_jurusan_kelas_idx
  on public.users (jurusan, kelas);
```

Alur pendaftaran:

1. `/register` — siswa mengisi nama, email, kata sandi. Akun dibuat di Supabase Auth
   (`email_confirm = false`) **tanpa** mengirim email apa pun.
2. `/register/lengkapi` — siswa mengisi **nama lengkap**, memilih **jurusan**
   (PPLG / TJKT / DKV / TKR), dan **kelas** (X / XI / XII). Nama wajib diisi sendiri dan
   tidak boleh sama dengan alamat email (termasuk potongan sebelum `@`); isian otomatis
   dari email dikosongkan supaya pengguna mengetik nama aslinya. Endpoint
   `src/app/api/auth/lengkapi/route.ts` menyimpannya ke tabel `users`, lalu **baru**
   meminta Supabase mengirim kode verifikasi.
3. `/register?verifikasi=1` — siswa memasukkan 6 digit kode.

Pendaftar lewat Google juga diarahkan ke `/register/lengkapi` dan tidak menerima kode email
(email sudah diverifikasi Google). Daftar pilihan ada di `src/lib/sekolah.ts`, sedangkan
validasi di server memakai berkas yang sama. Login siswa yang datanya belum lengkap juga
diarahkan kembali ke halaman tersebut.

### 9. Formulir SPMB / PPDB Mandiri

Halaman `/spmb` menggantikan Google Form sekolah dan terbuka untuk umum (pendaftar tidak
perlu punya akun). Isiannya: nama, alamat email aktif, jenis kelamin, tempat lahir,
tanggal lahir (`dd/mm/yyyy`), asal SLTP / SMP / MTs, alamat tempat tinggal, no. HP /
WhatsApp, pilihan jurusan 1 dan 2 (PPLG / TJKT / DKV / TKR), serta nama dan no. HP
orang tua / wali.

Tombol **Buka SPMB** di footer beranda, **PPDB / SPMB** di hero, dan **PPDB** di halaman
jurusan sekarang mengarah ke `/spmb`.

Jalankan migrasi berikut sekali di Supabase SQL Editor (atau `supabase db push`):
`supabase/migrations/20261025000000_add_spmb_pendaftar.sql` (tabel
`public.spmb_pendaftar` beserta constraint pilihan jurusan, nomor HP, dan indeks unik
`lower(email)`) lalu `supabase/migrations/20261025000001_add_spmb_status.sql` (kolom
`status` + `status_diubah_at` untuk keputusan panitia).

Cara kerjanya:

1. Formulir divalidasi di peramban dengan `src/lib/spmb.ts` (`periksaSpmb`): email harus
   valid, tanggal lahir harus nyata dan tidak di masa depan, nomor HP dinormalkan ke
   `08…`, serta pilihan jurusan 2 wajib berbeda dari pilihan 1.
2. `POST /api/spmb` menjalankan validasi yang sama lalu menyimpan ke `spmb_pendaftar`
   memakai service role. Satu email hanya boleh mendaftar sekali (ditolak dengan 409).
3. RLS aktif tanpa policy, jadi anon/authenticated tidak bisa membaca atau menulis
   langsung — data pendaftar hanya terlihat lewat panel admin `/dashboard/spmb`
   (khusus admin).

---

## 🔑 Lupa Kata Sandi

Alur reset memakai tautan email Supabase Auth (bukan kode OTP):

1. `/lupa-password` — pengguna mengetik email akun, dikirim ke
   `src/app/api/auth/lupa-password/route.ts` yang memanggil
   `supabase.auth.resetPasswordForEmail()` dengan
   `redirectTo = <origin>/auth/callback?next=/reset-password`.
   Balasannya selalu generik agar tidak membocorkan email mana yang terdaftar.
2. Tautan di email membuka `/auth/callback?next=/reset-password`. Route itu menukar `code`
   menjadi session (cookie `httpOnly`) lalu mengalihkan ke `/reset-password`.
3. `/reset-password` menampilkan formulir kata sandi baru; `POST
   /api/auth/reset-password` memanggil `updateUser({ password })`, mengakhiri session
   recovery, lalu mengarahkan ke `/login?reset=berhasil`.

Catatan:

- Tautan reset hanya bisa dipakai **sekali** dan harus dibuka di peramban yang sama dengan
  saat meminta reset (PKCE menyimpan verifier di cookie). Kalau tautan kedaluwarsa, minta
  ulang dari `/lupa-password`.
- Pastikan **Redirect URLs** di Supabase memuat `/auth/callback` dan pola `/**` untuk setiap
  domain (termasuk domain Vercel), sama seperti syarat Google OAuth di atas.
- Email reset dikirim oleh Supabase. Kalau pengiriman email bawaan Supabase kena batas
  frekuensi, atur **Authentication → Emails → SMTP Settings** dengan SMTP sendiri.
- Akun yang hanya punya NISN/username (`<nama>@sekolah.local`) tidak punya kotak surat,
  jadi tidak bisa memakai alur ini — admin sekolah perlu mengatur ulang kata sandinya.
  Akun Google cukup memakai tombol “Masuk dengan Google”.

---

## 🧭 Panel Dashboard (Admin & Guru)

Semua halaman panel berada di bawah `/dashboard` dan memakai sidebar biru di kiri
(`src/components/dashboard/SidebarDashboard.tsx`). `src/app/dashboard/layout.tsx`
menjaga akses di server: belum login → `/login`, role siswa → beranda.

| Halaman | Akses | Isi |
|---|---|---|
| `/dashboard` | admin, guru | Ringkasan jumlah pengguna, pengajuan NISN, dan berita |
| `/dashboard/pengguna` | **admin** | Daftar pengguna, pencarian, dialog filter, urutan, paginasi |
| `/dashboard/spmb` | **admin** | Daftar pendaftar SPMB, filter, terima / tolak |
| `/dashboard/verifikasi` | admin, guru | Verifikasi / tolak NISN siswa |
| `/dashboard/berita` | admin, guru | CRUD berita lewat popup yang sudah ada |

### Data pengguna (`/dashboard/pengguna`)

- Setiap baris punya checkbox; checkbox di kepala tabel memilih **semua pengguna di
  halaman itu**. Pilihan otomatis dikosongkan saat pindah halaman / mengganti filter.
- **Naikkan kelas** menaikkan semua siswa terpilih satu tingkat: `X → XI`, `XI → XII`.
  Siswa kelas `XII`, akun tanpa kelas, dan akun guru/admin dilewati (jumlahnya dilaporkan).
- **Hapus** memakai **dua konfirmasi**: ringkasan akun yang akan dihapus, lalu mengetik
  `HAPUS`. Penghapusan menghapus baris `public.users` sekaligus akun Supabase Auth.
- Tombol **Filter** membuka popup berisi role, jurusan, kelas, status NISN (termasuk
  **Belum diisi**), serta urutan **Alfabetis (nama)** atau **Terbaru (tanggal daftar)**
  dengan arah naik/turun. Filter berlaku bersama pencarian; badge angka menandai filter
  aktif dan tombol **Atur ulang** mengembalikannya.
- Tombol pensil membuka modal edit: nama, NISN, jurusan, kelas, dan role
  (`siswa` / `guru` / `admin`). **Password tidak dapat diubah** dari panel ini.
- Pengaman: admin tidak bisa menurunkan role akunnya sendiri, menghapus akunnya sendiri,
  atau menghilangkan admin terakhir.

Endpoint yang dipakai: `src/app/api/admin/pengguna/route.ts`
(`GET` daftar + paginasi, `PATCH` edit satu pengguna, `POST` aksi massal
`naikkan-kelas` / `hapus`). Hanya role admin yang lolos (401/403 untuk lainnya).

### Pendaftar SPMB (`/dashboard/spmb`)

- Halaman dibagi menjadi **tabel per jurusan**: tab **Semua**, **PPLG**, **TJKT**,
  **DKV**, dan **TKR**, masing-masing dengan jumlah pendaftarnya. Tab jurusan memakai
  **pilihan jurusan 1** pendaftar (pilihan utama); pilihan jurusan 2 tetap tampil di kolom
  tabel dan modal detail.
- Di dalam tab, chip status **Semua / Menunggu / Diterima / Ditolak** menyaring tabel
  beserta jumlahnya. Pencarian mencakup nama, email, asal sekolah, dan nomor HP pendaftar
  maupun wali, dan juga mempersempit angka pada tab serta chip.
- Tombol **Ekspor Excel** mengunduh tabel tab yang sedang dibuka (mengikuti kata pencarian)
  sebagai file `.xlsx`, dengan pilihan isi **Hanya diterima**, **Hanya ditolak**, atau
  **Semua status**. File berisi 16 kolom (data siswa, asal sekolah, kontak, kedua pilihan
  jurusan, wali, status, tanggal daftar/keputusan), header beku + autofilter, tanggal
  `dd/mm/yyyy`, dan jam WIB.
- Tiap baris punya tombol **Terima**, **Tolak**, **Batalkan keputusan** (kembali ke
  menunggu), dan **Detail** (modal berisi seluruh isian formulir). Checkbox dipakai untuk
  **Terima** / **Tolak** massal; pilihan dikosongkan saat pindah halaman, tab, atau status.
- Pendaftar baru otomatis berstatus `menunggu`. Keputusan hanya mengubah status — tidak
  mengirim email/WhatsApp otomatis.

Endpoint: `src/app/api/admin/spmb/route.ts` (`GET` daftar per tab + status + pencarian +
rekap per jurusan, `POST { aksi: "terima" | "tolak" | "menunggu", ids }` untuk satu atau
banyak pendaftar) dan `src/app/api/admin/spmb/ekspor/route.ts` (`GET` file `.xlsx`).
Keduanya hanya meloloskan role admin; data dibaca dengan service role karena RLS tabelnya
tanpa policy. File Excel dibuat dengan `exceljs` di server (runtime Node.js).

---

## 🚀 Status Rencana Pengembangan (Roadmap)

- [x] **Tahap I:** Desain UI/UX, arsitektur rute Next.js 16, dan integrasi Supabase.
- [x] **Tahap II:** Konfigurasi Groq LLM untuk AI Fiska & komponen 3D React Three Fiber.
- [x] **Tahap III:** Pembuatan panel admin CMS dan Supabase Storage bucket.
- [x] **Tahap IV:** Deployment penuh ke Vercel dan optimasi responsif.
- [ ] **Tahap V (Pengembangan Lanjutan):** Melengkapi informasi guru, staf, serta daftar ekstrakurikuler.
- [ ] **Tahap VI (Penyempurnaan Chatbot):** Integrasi karakter visual Chibi AI Fiska yang animated & interaktif.

---

## 📝 Lisensi & Catatan

Proyek ini dikembangkan khusus untuk mengikuti ajang kompetisi pengembangan web oleh Tim **Ini Aja Dulu** dari **SMK Telekomunikasi Tunas Harapan**.
