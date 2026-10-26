import { Metadata } from "next";
import ForumKelas from "@/components/forum/ForumKelas";

export const metadata: Metadata = {
  title: "Forum Kelas XII | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas XII SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXIIPage() {
  return (
    <ForumKelas
      kelas="XII"
      deskripsi="Persiapan ujian, wisuda, dan masa depan. Saling support menuju lulusan yang siap kerja."
    />
  );
}
