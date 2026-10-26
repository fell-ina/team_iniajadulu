import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Balasan, ForumSession, KelasForum, Topik } from "@/lib/forum-types";

/**
 * src/lib/forum-server.ts
 * ---------------------------------------------------------------------------
 * Helper server-only untuk forum: membaca sesi, memetakan baris Supabase ke
 * bentuk yang dipakai UI, dan membaca daftar topik/balasan.
 *
 * Tabel yang dipakai:
 *   forum_topik, forum_balasan, forum_like, users
 * ---------------------------------------------------------------------------
 */

export type BarisTopik = {
  id: string;
  judul: string;
  konten: string;
  kategori: string;
  kelas: string | null;
  penulis_id: string;
  created_at: string;
  updated_at: string;
  like_count: number | null;
  balasan_count: number | null;
};

export type BarisBalasan = {
  id: string;
  topik_id: string;
  parent_id: string | null;
  konten: string;
  penulis_id: string;
  created_at: string;
  updated_at: string;
  like_count: number | null;
};

export function buatAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function kelasSah(nilai: string | null): KelasForum | null {
  return nilai === "X" || nilai === "XI" || nilai === "XII" ? nilai : null;
}

/** User yang sedang login + profil forum-nya, atau null. */
export async function sesiForum(): Promise<ForumSession | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = buatAdmin();
  const { data: profil, error } = await admin
    .from("users")
    .select("nama, role, kelas, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profil) {
    if (error) console.warn("[forum] gagal membaca profil:", error.message);
    return null;
  }

  const role = profil.role as string | null;
  if (role !== "siswa" && role !== "guru" && role !== "admin") return null;

  const status = profil.verification_status as string | null;

  return {
    userId: user.id,
    nama: (profil.nama as string | null) ?? "Pengguna",
    role,
    kelas: kelasSah((profil.kelas as string | null) ?? null),
    verificationStatus:
      status === "menunggu" || status === "terverifikasi" || status === "ditolak"
        ? status
        : "belum",
  };
}

/** Guru & admin selalu boleh; siswa harus terverifikasi dan punya kelas. */
export function bolehIkutForum(sesi: ForumSession): boolean {
  if (sesi.role === "guru" || sesi.role === "admin") return true;
  return sesi.verificationStatus === "terverifikasi" && sesi.kelas !== null;
}

/** Peta id user -> nama, untuk kolom penulis_id yang hanya menyimpan uuid. */
export async function petaNama(ids: string[]): Promise<Map<string, string>> {
  const unik = [...new Set(ids)].filter(Boolean);
  const peta = new Map<string, string>();
  if (!unik.length) return peta;

  const { data, error } = await buatAdmin()
    .from("users")
    .select("id, nama")
    .in("id", unik);

  if (error) {
    console.warn("[forum] gagal membaca nama penulis:", error.message);
    return peta;
  }

  for (const baris of data ?? []) {
    peta.set(baris.id as string, (baris.nama as string | null) ?? "Pengguna");
  }
  return peta;
}

export function topikDariBaris(
  baris: BarisTopik,
  nama: Map<string, string>,
  disukai: Set<string>
): Topik {
  return {
    id: baris.id,
    judul: baris.judul,
    konten: baris.konten,
    kategori: baris.kategori,
    kelas: kelasSah(baris.kelas),
    penulisId: baris.penulis_id,
    penulisNama: nama.get(baris.penulis_id) ?? "Pengguna",
    createdAt: baris.created_at,
    updatedAt: baris.updated_at,
    likeCount: baris.like_count ?? 0,
    balasanCount: baris.balasan_count ?? 0,
    userLiked: disukai.has(baris.id),
  };
}

/** Topik yang pernah disukai user (tabel forum_like). */
async function topikDisukai(userId: string | null, topikIds: string[]): Promise<Set<string>> {
  if (!userId || !topikIds.length) return new Set();

  const { data, error } = await buatAdmin()
    .from("forum_like")
    .select("topik_id")
    .eq("user_id", userId)
    .in("topik_id", topikIds);

  if (error) {
    console.warn("[forum] gagal membaca like:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((b) => b.topik_id as string));
}

/** Daftar topik satu kelas (null = forum guru), terbaru dulu. */
export async function ambilTopik(
  kelas: KelasForum | null,
  userId: string | null = null
): Promise<Topik[]> {
  let kueri = buatAdmin()
    .from("forum_topik")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  kueri = kelas === null ? kueri.is("kelas", null) : kueri.eq("kelas", kelas);

  const { data, error } = await kueri;
  if (error) throw new Error(error.message);

  const baris = (data ?? []) as BarisTopik[];
  const [nama, disukai] = await Promise.all([
    petaNama(baris.map((b) => b.penulis_id)),
    topikDisukai(userId, baris.map((b) => b.id)),
  ]);

  return baris.map((b) => topikDariBaris(b, nama, disukai));
}

export async function ambilTopikSatu(id: string): Promise<Topik | null> {
  const { data, error } = await buatAdmin()
    .from("forum_topik")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const nama = await petaNama([(data as BarisTopik).penulis_id]);
  return topikDariBaris(data as BarisTopik, nama, new Set());
}

/** Balasan satu topik, sudah disusun menjadi pohon satu tingkat. */
export async function ambilBalasan(topikId: string): Promise<Balasan[]> {
  const { data, error } = await buatAdmin()
    .from("forum_balasan")
    .select("*")
    .eq("topik_id", topikId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const baris = (data ?? []) as BarisBalasan[];
  const nama = await petaNama(baris.map((b) => b.penulis_id));

  const semua: Balasan[] = baris.map((b) => ({
    id: b.id,
    topikId: b.topik_id,
    parentId: b.parent_id,
    konten: b.konten,
    penulisId: b.penulis_id,
    penulisNama: nama.get(b.penulis_id) ?? "Pengguna",
    createdAt: b.created_at,
    balasanAnak: [],
  }));

  const peta = new Map(semua.map((b) => [b.id, b]));
  const akar: Balasan[] = [];

  for (const balasan of semua) {
    const induk = balasan.parentId ? peta.get(balasan.parentId) : null;
    if (induk) induk.balasanAnak.push(balasan);
    else akar.push(balasan);
  }

  return akar;
}

/** Sinkronkan denormalisasi forum_topik.balasan_count dengan isi tabel balasan. */
export async function segarkanJumlahBalasan(topikId: string): Promise<void> {
  const admin = buatAdmin();
  const { count, error } = await admin
    .from("forum_balasan")
    .select("*", { count: "exact", head: true })
    .eq("topik_id", topikId);

  if (error) {
    console.warn("[forum] gagal menghitung balasan:", error.message);
    return;
  }

  const { error: galatUpdate } = await admin
    .from("forum_topik")
    .update({ balasan_count: count ?? 0 })
    .eq("id", topikId);

  if (galatUpdate) {
    console.warn("[forum] gagal memperbarui balasan_count:", galatUpdate.message);
  }
}
