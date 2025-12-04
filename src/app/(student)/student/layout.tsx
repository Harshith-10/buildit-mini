import ThemeToggle from "@/components/common/theme-toggle";
import StudentSidebar from "@/components/student/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
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
    );
}
