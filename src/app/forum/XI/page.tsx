import { Metadata } from "next";
import { ForumKelasClient } from "@/app/forum/[kelas]/page";

export const metadata: Metadata = {
  title: "Forum Kelas XI | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas XI SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXIPage() {
  return (
    <ForumKelasClient
      kelas="XI"
      label="Kelas XI"
      deskripsi="Diskusi tingkat lanjut: project, magang, dan persiapan kelulusan. Saling berbagi pengalaman."
      warna="blue"
      warnaHex="#3b82f6"
      warnaHover="#2563eb"
    />
  );
}