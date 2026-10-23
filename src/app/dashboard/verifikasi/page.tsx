import DaftarVerifikasiNisn from "@/components/DaftarVerifikasiNisn";

/**
 * /dashboard/verifikasi — terima / tolak pengajuan NISN siswa (admin & guru).
 */
export const dynamic = "force-dynamic";

export default function HalamanVerifikasi() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
            Verifikasi pelajar
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#021024] sm:text-4xl">
            Pengajuan NISN
          </h1>
        </div>
      </div>

      <div className="mt-8">
        <DaftarVerifikasiNisn />
      </div>
    </div>
  );
}
