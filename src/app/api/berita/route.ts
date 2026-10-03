import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * app/api/berita/route.ts
 * ---------------------------------------------------------------------------
 * CRUD berita untuk dashboard admin & guru.
 *
 *  - GET    : PUBLIK daftar berita, ?q= cari judul, ?id= satu berita, ?limit=
 *  - POST   : tambah berita (multipart: judul, subjudul, konten, gambar)
 *  - PUT    : edit berita (multipart: id via query ?id=, judul, subjudul,
 *             konten, gambar opsional, hapus_gambar="1" untuk hapus gambar)
 *  - DELETE : hapus berita (?id=) + hapus file gambar di Storage
 *
 * Storage bucket publik: 'imageBerita'
 *
 * SQL yang dibutuhkan (jalankan sekali di Supabase SQL Editor):
 *   alter table public.berita add column if not exists gambar_url text;
 *   alter table public.berita add column if not exists subjudul text;
 * ---------------------------------------------------------------------------
 */

const BUCKET = "imageBerita";
const MAKS_UKURAN_GAMBAR = 4 * 1024 * 1024; // 4 MB

const TIPE_GAMBAR: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type SessionClient = Awaited<ReturnType<typeof buatSessionClient>>;
type AdminClient = ReturnType<typeof buatAdminClient>;

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

/** Kenali user + pastikan role admin/guru. Kembalikan { user, admin } atau Response error. */
async function wajibAdminGuru(): Promise<
  { user: { id: string }; admin: AdminClient } | NextResponse
> {
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
  const { data: profil, error } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, message: "Gagal memeriksa peran pengguna." },
      { status: 500 }
    );
  }
  if (profil?.role !== "admin" && profil?.role !== "guru") {
    return NextResponse.json(
      { ok: false, message: "Hanya admin dan guru yang boleh mengelola berita." },
      { status: 403 }
    );
  }
  return { user: { id: user.id }, admin };
}

/** Ambil path storage dari publicUrl (untuk hapus file lama). */
function pathDariPublicUrl(url: string | null): string | null {
  if (!url) return null;
  const penanda = `/${BUCKET}/`;
  const idx = url.indexOf(penanda);
  if (idx === -1) return null;
  return url.slice(idx + penanda.length).split("?")[0];
}

function validasiTeks(judul: string, subjudul: string, konten: string): string | null {
  if (!judul || !konten) return "Judul dan isi berita wajib diisi.";
  if (judul.length > 200) return "Judul terlalu panjang (maksimal 200 karakter).";
  if (subjudul.length > 300) return "Subjudul terlalu panjang (maksimal 300 karakter).";
  if (konten.length > 20000) return "Isi berita terlalu panjang (maksimal 20.000 karakter).";
  return null;
}

function validasiGambar(berkas: File | null): string | null {
  if (!berkas) return null;
  if (!(berkas.type in TIPE_GAMBAR)) return "Format gambar harus JPG, PNG, atau WebP.";
  if (berkas.size > MAKS_UKURAN_GAMBAR) return "Ukuran gambar terlalu besar (maksimal 4 MB).";
  return null;
}

async function uploadGambar(
  admin: AdminClient,
  berkas: File
): Promise<{ path: string; url: string } | { error: string }> {
  const ekstensi = TIPE_GAMBAR[berkas.type];
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ekstensi}`;
  const { error } = await admin.storage.from(BUCKET).upload(path, berkas, {
    contentType: berkas.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[berita] gagal upload gambar:", error.message);
    return { error: "Gagal mengunggah gambar. Coba lagi sebentar lagi." };
  }
  const url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return { path, url };
}

/** Insert dengan fallback bila kolom 'subjudul' belum ada di DB. */
async function insertBerita(
  admin: AdminClient,
  baris: { judul: string; subjudul: string | null; konten: string; penulis_id: string; gambar_url: string | null }
) {
  let { error } = await admin.from("berita").insert(baris);
  if (error && /subjudul/i.test(error.message)) {
    // Kolom subjudul belum ada -> simpan tanpa subjudul.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { subjudul, ...tanpaSubjudul } = baris;
    const retry = await admin.from("berita").insert(tanpaSubjudul);
    error = retry.error;
  }
  return error;
}

/* ============================== GET : daftar ============================== */
// GET dibuat PUBLIK agar halaman utama (/), /berita, dan /berita/[slug]
// bisa menampilkan berita yang ditambah dari dashboard tanpa perlu login.
// POST / PUT / DELETE tetap wajib admin/guru (lewat wajibAdminGuru).
export async function GET(request: Request) {
  const admin = buatAdminClient();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const id = (searchParams.get("id") ?? "").trim();
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 100;

  // Coba select lengkap (dengan subjudul). Fallback tanpa subjudul bila kolom belum ada.
  let query = admin
    .from("berita")
    .select("id, judul, subjudul, konten, gambar_url, penulis_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (id) query = query.eq("id", id);
  if (q) query = query.ilike("judul", `%${q}%`);

  let { data, error } = await query;
  if (error && /subjudul/i.test(error.message)) {
    let fb = admin
      .from("berita")
      .select("id, judul, konten, gambar_url, penulis_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (id) fb = fb.eq("id", id);
    if (q) fb = fb.ilike("judul", `%${q}%`);
    const retry = await fb;
    data = (retry.data as typeof data) ?? [];
    error = retry.error;
    // Tambahkan subjudul kosong agar bentuk respons konsisten.
    if (!error && data) data = (data as unknown as Record<string, unknown>[]).map((r) => ({ subjudul: null, ...r })) as typeof data;
  }

  if (error) {
    console.error("[berita] gagal ambil daftar:", error.message);
    return NextResponse.json(
      { ok: false, message: "Gagal memuat daftar berita." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data: data ?? [] });
}

/* ============================== POST : tambah ============================= */
export async function POST(request: Request) {
  const auth = await wajibAdminGuru();
  if (auth instanceof NextResponse) return auth;
  const { user, admin } = auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }

  const judul = String(formData.get("judul") ?? "").trim();
  const subjudul = String(formData.get("subjudul") ?? "").trim();
  const konten = String(formData.get("konten") ?? "").trim();
  const inputGambar = formData.get("gambar");
  const berkasGambar =
    inputGambar instanceof File && inputGambar.size > 0 ? inputGambar : null;

  const errTeks = validasiTeks(judul, subjudul, konten);
  if (errTeks) return NextResponse.json({ ok: false, message: errTeks }, { status: 400 });

  const errGambar = validasiGambar(berkasGambar);
  if (errGambar) return NextResponse.json({ ok: false, message: errGambar }, { status: 400 });

  let gambarPath: string | null = null;
  let gambarUrl: string | null = null;
  if (berkasGambar) {
    const hasil = await uploadGambar(admin, berkasGambar);
    if ("error" in hasil) {
      return NextResponse.json({ ok: false, message: hasil.error }, { status: 500 });
    }
    gambarPath = hasil.path;
    gambarUrl = hasil.url;
  }

  const error = await insertBerita(admin, {
    judul,
    subjudul: subjudul || null,
    konten,
    penulis_id: user.id,
    gambar_url: gambarUrl,
  });

  if (error) {
    console.error("[berita] gagal insert:", error.message);
    if (gambarPath) await admin.storage.from(BUCKET).remove([gambarPath]);
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan berita. Coba lagi sebentar lagi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Berita berhasil diunggah." }, { status: 201 });
}

/* ============================== PUT : edit ================================ */
export async function PUT(request: Request) {
  const auth = await wajibAdminGuru();
  if (auth instanceof NextResponse) return auth;
  const { admin } = auth;

  const { searchParams } = new URL(request.url);
  const id = (searchParams.get("id") ?? "").trim();
  if (!id) {
    return NextResponse.json({ ok: false, message: "ID berita tidak ditemukan." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }

  const judul = String(formData.get("judul") ?? "").trim();
  const subjudul = String(formData.get("subjudul") ?? "").trim();
  const konten = String(formData.get("konten") ?? "").trim();
  const hapusGambar = String(formData.get("hapus_gambar") ?? "") === "1";
  const inputGambar = formData.get("gambar");
  const berkasBaru =
    inputGambar instanceof File && inputGambar.size > 0 ? inputGambar : null;

  const errTeks = validasiTeks(judul, subjudul, konten);
  if (errTeks) return NextResponse.json({ ok: false, message: errTeks }, { status: 400 });
  const errGambar = validasiGambar(berkasBaru);
  if (errGambar) return NextResponse.json({ ok: false, message: errGambar }, { status: 400 });

  // Ambil data lama (untuk tahu gambar lama).
  const { data: lama, error: errLama } = await admin
    .from("berita")
    .select("gambar_url")
    .eq("id", id)
    .maybeSingle();

  if (errLama) {
    return NextResponse.json({ ok: false, message: "Gagal membaca data berita." }, { status: 500 });
  }
  if (!lama) {
    return NextResponse.json({ ok: false, message: "Berita tidak ditemukan." }, { status: 404 });
  }

  const gambarLamaPath = pathDariPublicUrl((lama as { gambar_url: string | null }).gambar_url);
  let gambarUrlBaru: string | null | undefined = undefined; // undefined = tidak berubah
  let gambarPathBaru: string | null = null;

  if (berkasBaru) {
    const hasil = await uploadGambar(admin, berkasBaru);
    if ("error" in hasil) {
      return NextResponse.json({ ok: false, message: hasil.error }, { status: 500 });
    }
    gambarPathBaru = hasil.path;
    gambarUrlBaru = hasil.url;
  } else if (hapusGambar) {
    gambarUrlBaru = null;
  }

  // Susun payload update.
  const payload: Record<string, unknown> = { judul, konten };
  // Sertakan subjudul bila ada nilainya / kolom kemungkinan ada.
  payload["subjudul"] = subjudul || null;
  if (gambarUrlBaru !== undefined) payload["gambar_url"] = gambarUrlBaru;

  let { error } = await admin.from("berita").update(payload).eq("id", id);

  // Fallback bila kolom subjudul belum ada.
  if (error && /subjudul/i.test(error.message)) {
    delete payload["subjudul"];
    const retry = await admin.from("berita").update(payload).eq("id", id);
    error = retry.error;
  }

  if (error) {
    console.error("[berita] gagal update:", error.message);
    if (gambarPathBaru) await admin.storage.from(BUCKET).remove([gambarPathBaru]);
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan perubahan." },
      { status: 500 }
    );
  }

  // Bersihkan file lama bila diganti / dihapus.
  if ((berkasBaru || hapusGambar) && gambarLamaPath) {
    await admin.storage.from(BUCKET).remove([gambarLamaPath]);
  }

  return NextResponse.json({ ok: true, message: "Berita berhasil diperbarui." });
}

/* ============================ DELETE : hapus ============================== */
export async function DELETE(request: Request) {
  const auth = await wajibAdminGuru();
  if (auth instanceof NextResponse) return auth;
  const { admin } = auth;

  const { searchParams } = new URL(request.url);
  const id = (searchParams.get("id") ?? "").trim();
  if (!id) {
    return NextResponse.json({ ok: false, message: "ID berita tidak ditemukan." }, { status: 400 });
  }

  const { data: lama } = await admin
    .from("berita")
    .select("gambar_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("berita").delete().eq("id", id);
  if (error) {
    console.error("[berita] gagal hapus:", error.message);
    return NextResponse.json({ ok: false, message: "Gagal menghapus berita." }, { status: 500 });
  }

  const pathLama = pathDariPublicUrl(
    (lama as { gambar_url: string | null } | null)?.gambar_url ?? null
  );
  if (pathLama) await admin.storage.from(BUCKET).remove([pathLama]);

  return NextResponse.json({ ok: true, message: "Berita berhasil dihapus." });
}
