import { Metadata } from "next";
import ForumKelas from "@/components/forum/ForumKelas";

export const metadata: Metadata = {
  title: "Forum Kelas X | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas X SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXPage() {
  return (
    <ForumKelas
      kelas="X"
      deskripsi="Ruang diskusi untuk angkatan terbaru. Kenalan, tanya jawab, dan belajar bersama dari dasar."
    />
  );
}
