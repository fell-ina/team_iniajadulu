import { Metadata } from "next";
import { ForumKelasClient } from "@/app/forum/[kelas]/page";

export const metadata: Metadata = {
  title: "Forum Kelas XII | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas XII SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXIIPage() {
  return (
    <ForumKelasClient
      kelas="XII"
      label="Kelas XII"
      deskripsi="Persiapan ujian, wisuda, dan masa depan. Saling support menuju lulusan yang siap kerja."
      warna="purple"
      warnaHex="#a855f7"
      warnaHover="#9333ea"
    />
  );
}