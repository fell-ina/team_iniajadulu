import { redirect } from "next/navigation";

/**
 * /admin/berita sudah dipindahkan ke /dashboard/berita.
 * Rute lama dipertahankan agar tautan/bookmark tidak putus.
 */
export default function AdminBerita() {
  redirect("/dashboard/berita");
}
