import { NextResponse } from "next/server";
import { POLA_UUID, potongTeks, sesiAdminForum } from "@/lib/admin-forum";
import { buatAdmin } from "@/lib/dashboard";

/**
 * app/api/admin/forum/topik/[id]/route.ts
 * ---------------------------------------------------------------------------
 * DELETE /api/admin/forum/topik/:id -> hapus permanen satu topik forum siswa.
 *
 * Hanya admin (session + users.role diverifikasi di server). Balasan, like, dan
 * laporan yang menunjuk topik ini ikut terhapus lewat ON DELETE CASCADE yang
 * sudah ada; tidak ada perubahan skema/RLS.
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { admin, galat } = await sesiAdminForum();
  if (galat) return galat;

  const { id } = await params;
  if (!id || !POLA_UUID.test(id)) {
    return NextResponse.json(
      { ok: false, message: "ID topik tidak valid." },
      { status: 400 }
    );
  }

  const db = buatAdmin();

  const { data: topik, error: galatBaca } = await db
    .from("forum_topik")
    .select("id, judul")
    .eq("id", id)
    .maybeSingle();

  if (galatBaca) {
    console.error("[moderasi forum] gagal membaca topik:", galatBaca.message);
    return NextResponse.json(
      { ok: false, message: "Gagal memeriksa topik yang akan dihapus." },
      { status: 500 }
    );
  }

  if (!topik) {
    return NextResponse.json(
      { ok: false, message: "Topik tidak ditemukan atau sudah dihapus." },
      { status: 404 }
    );
  }

  // `.select("id")` memastikan baris benar-benar terhapus; tanpa ini operasi
  // yang ditolak (mis. RLS/konfigurasi kunci) bisa tampak sukses tanpa efek.
  const { data: terhapus, error } = await db
    .from("forum_topik")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[moderasi forum] gagal menghapus topik:", error.message);
    return NextResponse.json(
      { ok: false, message: "Gagal menghapus topik. Coba lagi." },
      { status: 500 }
    );
  }

  if (!terhapus || terhapus.length === 0) {
    console.error("[moderasi forum] topik tidak terhapus:", id);
    return NextResponse.json(
      {
        ok: false,
        message: "Topik tidak terhapus. Muat ulang halaman lalu coba lagi.",
      },
      { status: 500 }
    );
  }

  console.info(
    `[moderasi forum] admin ${admin.userId} menghapus topik ${id}`
  );

  return NextResponse.json({
    ok: true,
    id,
    message: `Topik "${potongTeks(String(topik.judul ?? "tanpa judul"))}" beserta komentarnya dihapus permanen.`,
  });
}
