"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/use-user-role";

export default function DashboardPage() {
  const { role, isLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (role === "guest") {
      router.push("/auth/login");
      return;
    }

    if (role === "super_admin" || role === "admin") {
      router.push("/admin/dashboard");
    } else if (role === "student") {
      router.push("/student/dashboard");
    } else {
      // Handle other roles or default
      router.push("/onboarding"); // Or some other page
    }
  }, [role, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  );
}
