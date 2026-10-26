import { Metadata } from "next";
import { ForumDetailClient } from "./ForumDetailClient";

interface PageProps {
  params: Promise<{ kelas: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { kelas, id } = await params;
  return {
    title: `Diskusi - Forum Kelas ${kelas} | SMK Telekomunikasi Tunas Harapan`,
    description: `Detail diskusi di Forum Kelas ${kelas}`,
  };
}

export default async function ForumDetailPage({ params }: PageProps) {
  const { kelas, id } = await params;
  
  if (!["X", "XI", "XII"].includes(kelas)) {
    return <div className="min-h-screen flex items-center justify-center">Kelas tidak valid</div>;
  }

  return <ForumDetailClient kelas={kelas as "X" | "XI" | "XII"} topikId={id} />;
}