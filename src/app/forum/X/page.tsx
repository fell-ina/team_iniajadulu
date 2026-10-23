import { Metadata } from "next";
import ForumKelasXClient from "./ForumKelasXClient";

export const metadata: Metadata = {
  title: "Forum Kelas X | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas X SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXPage() {
  return <ForumKelasXClient />;
}