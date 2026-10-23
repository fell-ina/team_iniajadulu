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
            Pengajuan NISN.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#021024]/55">
            Periksa NISN yang dikirim siswa, lalu{" "}
            <strong className="text-[#021024]">verifikasi</strong> atau{" "}
            <strong className="text-[#021024]">tolak</strong> pengajuannya. Persetujuan langsung
            mengubah status pelajar pada akun siswa.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <DaftarVerifikasiNisn />
      </div>
    </div>
  );
}
