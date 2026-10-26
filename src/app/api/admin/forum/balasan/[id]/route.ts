import { NextResponse } from "next/server";
import { POLA_UUID, potongTeks, sesiAdminForum } from "@/lib/admin-forum";
import { buatAdmin } from "@/lib/dashboard";

/**
 * app/api/admin/forum/balasan/[id]/route.ts
 * ---------------------------------------------------------------------------
 * DELETE /api/admin/forum/balasan/:id -> hapus permanen satu komentar siswa.
 *
 * Hanya admin. Balasan turunan ikut terhapus lewat ON DELETE CASCADE pada
 * forum_balasan.parent_id, dan trigger penghitung yang sudah ada memperbarui
 * forum_topik.balasan_count. Tidak ada perubahan skema/RLS.
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
      { ok: false, message: "ID komentar tidak valid." },
      { status: 400 }
    );
  }

  const db = buatAdmin();

  const { data: balasan, error: galatBaca } = await db
    .from("forum_balasan")
    .select("id, topik_id, konten")
    .eq("id", id)
    .maybeSingle();

  if (galatBaca) {
    console.error("[moderasi forum] gagal membaca komentar:", galatBaca.message);
    return NextResponse.json(
      { ok: false, message: "Gagal memeriksa komentar yang akan dihapus." },
      { status: 500 }
    );
  }

  if (!balasan) {
    return NextResponse.json(
      { ok: false, message: "Komentar tidak ditemukan atau sudah dihapus." },
      { status: 404 }
    );
  }

  // `.select("id")` memastikan komentar benar-benar terhapus, bukan sekadar
  // permintaan tanpa efek (mis. ditolak RLS) yang tampak sukses.
  const { data: terhapus, error } = await db
    .from("forum_balasan")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[moderasi forum] gagal menghapus komentar:", error.message);
    return NextResponse.json(
      { ok: false, message: "Gagal menghapus komentar. Coba lagi." },
      { status: 500 }
    );
  }

  if (!terhapus || terhapus.length === 0) {
    console.error("[moderasi forum] komentar tidak terhapus:", id);
    return NextResponse.json(
      {
        ok: false,
        message: "Komentar tidak terhapus. Muat ulang halaman lalu coba lagi.",
      },
      { status: 500 }
    );
  }

  console.info(
    `[moderasi forum] admin ${admin.userId} menghapus komentar ${id}`
  );

  return NextResponse.json({
    ok: true,
    id,
    topikId: balasan.topik_id as string,
    message: `Komentar "${potongTeks(String(balasan.konten ?? ""))}" dihapus permanen.`,
  });
}
