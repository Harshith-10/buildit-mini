"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/use-user-role";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ("admin" | "student" | "super_admin")[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { role, isLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (role === "guest") {
      router.push("/auth/login");
      return;
    }

    if (!allowedRoles.includes(role as (typeof allowedRoles)[number])) {
      // Redirect based on actual role if they are logged in but unauthorized for this specific page
      if (role === "student") {
        router.push("/student/dashboard");
      } else if (role === "admin" || role === "super_admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/"); // Fallback
      }
    }
  }, [role, isLoading, router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (
    role === "guest" ||
    !allowedRoles.includes(role as (typeof allowedRoles)[number])
  ) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
