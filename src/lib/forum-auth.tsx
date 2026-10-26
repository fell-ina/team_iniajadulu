"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type VerificationStatus = "belum" | "menunggu" | "terverifikasi" | "ditolak";
export type UserRole = "siswa" | "guru" | "admin" | null;
export type Kelas = "X" | "XI" | "XII" | null;

export interface ForumAuthState {
  userId: string | null;
  nama: string | null;
  role: UserRole;
  kelas: Kelas;
  verificationStatus: VerificationStatus;
  nisn: string | null;
  loading: boolean;
  error: string | null;
}

export interface ForumSession {
  userId: string;
  nama: string;
  role: "siswa" | "guru" | "admin";
  kelas: "X" | "XI" | "XII" | null;
  verificationStatus: "belum" | "menunggu" | "terverifikasi" | "ditolak";
  nisn: string | null;
}

const KELAS_ROUTE: Record<"X" | "XI" | "XII", string> = {
  X: "/forum/X",
  XI: "/forum/XI",
  XII: "/forum/XII",
};

function getKelasRoute(kelas: "X" | "XI" | "XII"): string {
  return KELAS_ROUTE[kelas];
}

export function useForumAuth(): ForumAuthState {
  const [state, setState] = useState<ForumAuthState>({
    userId: null,
    nama: null,
    role: null,
    kelas: null,
    verificationStatus: "belum",
    nisn: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    let abortController: AbortController | null = null;

    async function fetchSession() {
      try {
        abortController = new AbortController();
        const res = await fetch("/api/auth/me", { 
          credentials: "same-origin", 
          cache: "no-store",
          signal: abortController.signal
        });
        const data = await res.json();
        
        if (!mounted) return;

        if (data.ok && data.nama) {
          const role = data.role as UserRole;
          const kelas = data.kelas as Kelas;
          const verificationStatus = data.verification_status as VerificationStatus;
          
          setState({
            userId: data.userId || "",
            nama: data.nama,
            role,
            kelas,
            verificationStatus,
            nisn: data.nisn || null,
            loading: false,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, loading: false, error: "Belum login" }));
        }
      } catch (err) {
        if (mounted && err instanceof Error && err.name !== "AbortError") {
          setState(prev => ({ ...prev, loading: false, error: "Gagal memuat sesi" }));
        }
      }
    }

    fetchSession();
    
    // Refresh on window focus (after admin verifies)
    const onFocus = () => fetchSession();
    window.addEventListener("focus", onFocus);
    
    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      abortController?.abort();
    };
  }, []);

  return state;
}

export function useForumGuard(kelasDiperlukan?: "X" | "XI" | "XII") {
  const router = useRouter();
  const auth = useForumAuth();

  useEffect(() => {
    if (auth.loading) return; // masih loading

    // Belum login
    if (!auth.userId) {
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    if (auth.role === "admin") return;

    // Hanya siswa yang boleh akses forum siswa
    if (auth.role !== "siswa") {
      router.push("/dashboard");
      return;
    }

    // Belum terverifikasi
    if (auth.verificationStatus !== "terverifikasi") {
      router.push("/?verifikasi=diperlukan");
      return;
    }

    // Kelas tidak valid
    if (!auth.kelas || !["X", "XI", "XII"].includes(auth.kelas)) {
      router.push("/?kelas=tidak_valid");
      return;
    }

    // Jika kelas spesifik diperlukan, cek kecocokan
    if (kelasDiperlukan && auth.kelas !== kelasDiperlukan) {
      router.push(`/forum/${auth.kelas}`);
      return;
    }
  }, [auth, router, kelasDiperlukan]);

  return auth;
}

export function getKelasRedirect(kelas: "X" | "XI" | "XII"): string {
  return KELAS_ROUTE[kelas];
}

export function getLoginRedirectPath(currentPath: string): string {
  return `/login?redirect=${encodeURIComponent(currentPath)}`;
}

export function getForumAuthRedirect(auth: ForumAuthState, kelasDiperlukan?: "X" | "XI" | "XII"): string | null {
  // Belum login
  if (auth.loading) return null;
  if (!auth.userId) return "/login?redirect=" + encodeURIComponent(window.location.pathname);

  if (auth.role === "admin") return null;

  // Bukan siswa
  if (auth.role !== "siswa") return "/dashboard";
  
  // Belum verifikasi
  if (auth.verificationStatus !== "terverifikasi") {
    return "/?verifikasi=diperlukan";
  }
  
  // Kelas tidak valid
  if (!auth.kelas || !["X", "XI", "XII"].includes(auth.kelas)) {
    return "/?kelas=tidak_valid";
  }
  
  // Cek kelas yang diperlukan
  if (kelasDiperlukan && auth.kelas !== kelasDiperlukan) {
    return getKelasRedirect(auth.kelas);
  }
  
  return null; // Akses diizinkan
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

export function getVerificationStatusInfo(status: VerificationStatus) {
  const info = {
    belum: {
      label: "Belum Verifikasi",
      description: "Anda belum mengirim NISN untuk verifikasi.",
      actionLabel: "Kirim NISN",
      variant: "warning" as const,
      showAction: true,
    },
    menunggu: {
      label: "Menunggu Verifikasi",
      description: "NISN Anda sudah dikirim dan sedang menunggu verifikasi admin.",
      actionLabel: null,
      variant: "info" as const,
      showAction: false,
    },
    ditolak: {
      label: "Verifikasi Ditolak",
      description: "Verifikasi NISN Anda ditolak. Periksa kembali NISN Anda dan kirim ulang.",
      actionLabel: "Kirim Ulang NISN",
      variant: "error" as const,
      showAction: true,
    },
    terverifikasi: {
      label: "Terverifikasi",
      description: "Akun Anda sudah terverifikasi sebagai pelajar.",
      actionLabel: null,
      variant: "success" as const,
      showAction: false,
    },
  };
  
  return info[status];
}