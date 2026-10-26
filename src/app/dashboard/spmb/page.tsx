import { redirect } from "next/navigation";
import KelolaSpmb from "@/components/dashboard/KelolaSpmb";
import { ambilProfilDashboard } from "@/lib/dashboard";

/**
 * /dashboard/spmb — terima / tolak pendaftar SPMB (khusus admin).
 * Daftar pendaftar berasal dari formulir publik di /spmb.
 */
export const dynamic = "force-dynamic";

export default async function HalamanSpmb() {
  const profil = await ambilProfilDashboard();

  if (profil?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
            Penerimaan murid baru
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#021024] sm:text-4xl">
            Pendaftar SPMB
          </h1>
        </div>
      </div>

      <div className="mt-8">
        <KelolaSpmb />
      </div>
    </div>
  );
}
