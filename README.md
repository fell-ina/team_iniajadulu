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
/register               - Pendaftaran akun (email + Google) & verifikasi kode OTP
/register/lengkapi      - Pengisian jurusan & kelas sebelum kode verifikasi dikirim
/login                  - Portal Autentikasi Login Admin / Guru / Siswa
/admin/dashboard        - Panel CMS Admin (Tambah, Edit, & Hapus Berita)
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
4. Di Supabase → **Authentication → URL Configuration**, pastikan *Site URL* dan *Redirect URLs* memuat
   `http://localhost:3000/auth/callback` serta `https://domain-anda.vercel.app/auth/callback`.

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
2. `/register/lengkapi` — siswa memilih **jurusan** (PPLG / TJKT / DKV / TKR) dan
   **kelas** (X / XI / XII). Endpoint `src/app/api/auth/lengkapi/route.ts` menyimpannya ke
   tabel `users`, lalu **baru** meminta Supabase mengirim kode verifikasi.
3. `/register?verifikasi=1` — siswa memasukkan 6 digit kode.

Pendaftar lewat Google juga diarahkan ke `/register/lengkapi` dan tidak menerima kode email
(email sudah diverifikasi Google). Daftar pilihan ada di `src/lib/sekolah.ts`, sedangkan
validasi di server memakai berkas yang sama. Login siswa yang datanya belum lengkap juga
diarahkan kembali ke halaman tersebut.

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
