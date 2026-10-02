import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * app/api/berita/route.ts
 * ---------------------------------------------------------------------------
 * Endpoint untuk menambahkan berita baru (dengan gambar opsional).
 *
 *  - Request berupa multipart/form-data: judul, konten, gambar (opsional).
 *  - Client session (anon key + cookie) HANYA dipakai untuk mengenali user.
 *  - Client admin (service role, tanpa cookie) dipakai untuk membaca role,
 *    mengunggah gambar ke bucket Storage, dan menulis baris 'berita'.
 *  - Role diverifikasi ulang di server agar tidak bisa "dibohongi" dari client.
 *
 * Jalankan sekali di SQL Editor Supabase:
 *   alter table public.berita add column gambar_url text;
 * ---------------------------------------------------------------------------
 */

// Nama bucket (sudah dibuat sebagai PUBLIC di Supabase Storage).
const BUCKET = "imageBerita";

// Batas ukuran gambar. 4 MB agar aman dari batas body request di hosting
// serverless (mis. Vercel membatasi sekitar 4,5 MB).
const MAKS_UKURAN_GAMBAR = 4 * 1024 * 1024;

// Tipe gambar yang diizinkan -> ekstensi file. Ekstensi diambil dari tipe ini,
// BUKAN dari nama file kiriman user.
const TIPE_GAMBAR: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface BarisBerita {
  judul: string;
  konten: string;
  penulis_id: string;
  gambar_url: string | null;
}

export async function POST(request: Request) {
  // 1. Kenali user dari cookie session --------------------------------------
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Abaikan error jika dipanggil dari konteks yang tidak boleh set cookie
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Anda harus masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  // 2. Verifikasi ulang role user (client service role, tanpa cookie) -------
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: profil, error: profilError } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profilError) {
    return NextResponse.json(
      { ok: false, message: "Gagal memeriksa peran pengguna." },
      { status: 500 }
    );
  }

  if (profil?.role !== "admin" && profil?.role !== "guru") {
    return NextResponse.json(
      { ok: false, message: "Hanya admin dan guru yang boleh mengunggah berita." },
      { status: 403 }
    );
  }

  // 3. Baca dan validasi input (multipart/form-data) ------------------------
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  const judul = String(formData.get("judul") ?? "").trim();
  const konten = String(formData.get("konten") ?? "").trim();
  const inputGambar = formData.get("gambar");
  const berkasGambar =
    inputGambar instanceof File && inputGambar.size > 0 ? inputGambar : null;

  if (!judul || !konten) {
    return NextResponse.json(
      { ok: false, message: "Judul dan konten berita wajib diisi." },
      { status: 400 }
    );
  }
  if (judul.length > 200) {
    return NextResponse.json(
      { ok: false, message: "Judul terlalu panjang (maksimal 200 karakter)." },
      { status: 400 }
    );
  }
  if (konten.length > 20000) {
    return NextResponse.json(
      { ok: false, message: "Konten terlalu panjang (maksimal 20.000 karakter)." },
      { status: 400 }
    );
  }

  if (berkasGambar) {
    if (!(berkasGambar.type in TIPE_GAMBAR)) {
      return NextResponse.json(
        { ok: false, message: "Format gambar harus JPG, PNG, atau WebP." },
        { status: 400 }
      );
    }
    if (berkasGambar.size > MAKS_UKURAN_GAMBAR) {
      return NextResponse.json(
        { ok: false, message: "Ukuran gambar terlalu besar (maksimal 4 MB)." },
        { status: 400 }
      );
    }
  }

  // 4. Unggah gambar ke Storage (jika ada) ----------------------------------
  let gambarPath: string | null = null;
  let gambarUrl: string | null = null;

  if (berkasGambar) {
    const ekstensi = TIPE_GAMBAR[berkasGambar.type];
    // Nama acak -> tidak bisa ditebak dan tidak bentrok antar berita.
    gambarPath = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ekstensi}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(gambarPath, berkasGambar, {
        contentType: berkasGambar.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("[berita] gagal upload gambar:", uploadError.message);
      return NextResponse.json(
        { ok: false, message: "Gagal mengunggah gambar. Coba lagi sebentar lagi." },
        { status: 500 }
      );
    }

    gambarUrl = admin.storage.from(BUCKET).getPublicUrl(gambarPath).data.publicUrl;
  }

  // 5. Simpan berita (lewat client admin, karena 'berita' tak punya policy insert)
  const beritaBaru: BarisBerita = {
    judul,
    konten,
    penulis_id: user.id,
    gambar_url: gambarUrl,
  };

  const { error } = await admin.from("berita").insert(beritaBaru);

  if (error) {
    console.error("[berita] gagal insert:", error.message);
    // Hapus gambar yang sudah terlanjur diunggah supaya tidak jadi file yatim.
    if (gambarPath) {
      await admin.storage.from(BUCKET).remove([gambarPath]);
    }
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan berita. Coba lagi sebentar lagi." },
      { status: 500 }
    );
  }

  // 6. Sukses ---------------------------------------------------------------
  return NextResponse.json(
    { ok: true, message: "Berita berhasil diunggah." },
    { status: 201 }
  );
}
