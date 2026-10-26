import { Metadata } from "next";
import ForumKelas from "@/components/forum/ForumKelas";

export const metadata: Metadata = {
  title: "Forum Kelas XI | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas XI SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXIPage() {
  return (
    <ForumKelas
      kelas="XI"
      deskripsi="Diskusi tingkat lanjut: project, magang, dan persiapan kelulusan. Saling berbagi pengalaman."
    />
  );
}
