import { redirect } from "next/navigation";
import SidebarDashboard from "@/components/dashboard/SidebarDashboard";
import { ambilProfilDashboard, bolehMasukDashboard } from "@/lib/dashboard";

/**
 * app/dashboard/layout.tsx
 * ---------------------------------------------------------------------------
 * Kerangka semua halaman /dashboard/*: sidebar biru di kiri + penjaga akses.
 *   - belum login          -> /login
 *   - bukan admin/guru     -> beranda
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profil = await ambilProfilDashboard();

  if (!profil) {
    redirect("/login?alasan=tidak-ada-session");
  }

  if (!bolehMasukDashboard(profil.role)) {
    redirect("/?alasan=role-ditolak");
  }

  return (
    <div className="min-h-dvh bg-[#F4F9FF] text-[#021024]">
      <SidebarDashboard
        nama={profil.nama ?? "Pengguna"}
        role={profil.role ?? "guru"}
        email={profil.email}
      />
      <main className="lg:pl-64">{children}</main>
    </div>
  );
}
