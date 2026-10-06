# 🏫 Website Profil Sekolah Interaktif - SMK Telekomunikasi Tunas Harapan

> **Proyek Kompetisi Web (Tahap Penyisihan)**  
> Platform sistem informasi profil sekolah modern berbasis Next.js 16, terintegrasi dengan Asisten Virtual AI "Fiska" dan visualisasi model 3D interaktif.

🌐 **Live Demo:** [https://team-iniajadulu-tthhh.vercel.app/](https://team-iniajadulu-tthhh.vercel.app/)

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
/login                  - Portal Autentikasi Login Admin / Guru
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