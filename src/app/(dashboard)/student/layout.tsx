import RoleGuard from "@/components/auth/role-guard";
import ThemeToggle from "@/components/common/theme-toggle";
import StudentSidebar from "@/components/student/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["admin", "student", "super_admin"]}>
      <SidebarProvider>
        <StudentSidebar />
        <SidebarInset>
          <div className="flex h-full w-full flex-col">
            <div className="absolute top-4 right-4">
              <ThemeToggle />
            </div>
            <main className="flex flex-1 flex-col gap-4 p-4 w-full h-full">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  );
}
