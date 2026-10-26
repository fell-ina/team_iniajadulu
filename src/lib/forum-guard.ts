"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface ForumSession {
  userId: string;
  nama: string;
  role: "siswa" | "guru" | "admin";
  kelas: "X" | "XI" | "XII" | null;
  verificationStatus: "belum" | "menunggu" | "terverifikasi" | "ditolak";
}

export function useForumSession(): ForumSession | null {
  const [session, setSession] = useState<ForumSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/me", { 
          credentials: "same-origin", 
          cache: "no-store" 
        });
        const data = await res.json();
        
        if (mounted) {
          if (data.ok && data.nama && data.role) {
            setSession({
              userId: data.userId || "",
              nama: data.nama,
              role: data.role,
              kelas: data.kelas,
              verificationStatus: data.verification_status,
            });
          } else {
            setSession(null);
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      }
    }

    fetchSession();
    return () => { mounted = false; };
  }, []);

  return loading ? null : session;
}

export function useForumGuard(kelasDiperlukan?: "X" | "XI" | "XII") {
  const router = useRouter();
  const session = useForumSession();

  useEffect(() => {
    if (!session) return; // masih loading atau belum login

    // Harus login
    if (!session.userId) {
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    if (session.role === "admin") return;

    if (session.role === "guru") return;

    // Hanya siswa yang boleh akses forum siswa
    if (session.role !== "siswa") {
      router.push("/dashboard");
      return;
    }

    // Harus terverifikasi
    if (session.verificationStatus !== "terverifikasi") {
      router.push("/?verifikasi=diperlukan");
      return;
    }

    // Harus punya kelas yang valid
    if (!session.kelas || !["X", "XI", "XII"].includes(session.kelas)) {
      router.push("/?kelas=tidak_valid");
      return;
    }

    // Jika kelas spesifik diperlukan, cek kecocokan
    if (kelasDiperlukan && session.kelas !== kelasDiperlukan) {
      router.push(`/forum/${session.kelas}`);
      return;
    }
  }, [session, router, kelasDiperlukan]);

  return session;
}

export function getInitials(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}