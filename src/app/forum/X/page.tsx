import { Metadata } from "next";
import { ForumKelasClient } from "@/app/forum/[kelas]/page";

export const metadata: Metadata = {
  title: "Forum Kelas X | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas X SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXPage() {
  return (
    <ForumKelasClient
      kelas="X"
      label="Kelas X"
      deskripsi="Ruang diskusi untuk angkatan terbaru. Kenalan, tanya jawab, dan belajar bersama dari dasar."
      warna="emerald"
      warnaHex="#10b981"
      warnaHover="#059669"
    />
  );
}