import { useQuery } from "@tanstack/react-query";
import type { admins, students } from "@/db/schema";
import { useSession } from "@/lib/auth-client";

export type UserRole = "super_admin" | "admin" | "student" | "user" | "guest";

interface UserRoleData {
  role: UserRole;
  user?: typeof useSession extends () => { data: { user: infer U } | null }
    ? U
    : unknown;
  studentDetails?: typeof students.$inferSelect;
  adminDetails?: typeof admins.$inferSelect;
}

export function useUserRole() {
  const { data: session, isPending: isSessionPending } = useSession();

  const { data, isLoading, error } = useQuery<UserRoleData>({
    queryKey: ["user-role", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/auth/role");
      if (!res.ok) {
        throw new Error("Failed to fetch user role");
      }
      return res.json();
    },
    enabled: !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    role: data?.role || "guest",
    isLoading: isSessionPending || isLoading,
    error,
    data,
  };
}
