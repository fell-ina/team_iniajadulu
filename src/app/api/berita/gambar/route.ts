import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * app/api/berita/gambar/route.ts
 * ---------------------------------------------------------------------------
 * Upload gambar INLINE untuk isi berita (rich text markdown).
 *
 *  - POST : multipart dengan field `gambar` -> { ok: true, url }
 *           Wajib login admin/guru (sama seperti POST /api/berita).
 *           File disimpan di bucket publik 'imageBerita'.
 *
 * Frontend menyisipkan hasilnya sebagai markdown:
 *   ![keterangan](https://.../imageBerita/2026/uuid.webp)
 * di posisi kursor textarea, lalu halaman detail me-render-nya via
 * react-markdown.
 * ---------------------------------------------------------------------------
 */

const BUCKET = "imageBerita";
const MAKS_UKURAN_GAMBAR = 4 * 1024 * 1024; // 4 MB

const TIPE_GAMBAR: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

export async function POST(request: Request) {
  const supabase = await buatSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Anda harus masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  const admin = buatAdminClient();
  const { data: profil, error: errProfil } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (errProfil) {
    return NextResponse.json(
      { ok: false, message: "Gagal memeriksa peran pengguna." },
      { status: 500 }
    );
  }
  if (profil?.role !== "admin" && profil?.role !== "guru") {
    return NextResponse.json(
      { ok: false, message: "Hanya admin dan guru yang boleh mengunggah gambar." },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }

  const input = formData.get("gambar");
  const berkas = input instanceof File && input.size > 0 ? input : null;
  if (!berkas) {
    return NextResponse.json({ ok: false, message: "Pilih gambar terlebih dahulu." }, { status: 400 });
  }
  if (!(berkas.type in TIPE_GAMBAR)) {
    return NextResponse.json(
      { ok: false, message: "Format gambar harus JPG, PNG, atau WebP." },
      { status: 400 }
    );
  }
  if (berkas.size > MAKS_UKURAN_GAMBAR) {
    return NextResponse.json(
      { ok: false, message: "Ukuran gambar terlalu besar (maksimal 4 MB)." },
      { status: 400 }
    );
  }

  const ekstensi = TIPE_GAMBAR[berkas.type];
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ekstensi}`;
  const { error: errUpload } = await admin.storage.from(BUCKET).upload(path, berkas, {
    contentType: berkas.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (errUpload) {
    console.error("[berita/gambar] gagal upload:", errUpload.message);
    return NextResponse.json(
      { ok: false, message: "Gagal mengunggah gambar. Coba lagi sebentar lagi." },
      { status: 500 }
    );
  }

  const url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ ok: true, url }, { status: 201 });
}
