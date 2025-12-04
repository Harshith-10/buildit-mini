"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Home, FlaskConical } from "lucide-react";
import Link from "next/link";
import { NavUser } from "../dashboard/nav-user";

interface NavItem {
    title: string;
    icon: React.ReactNode;
    route: string;
}

const navigationItems: NavItem[] = [
    {
        title: "Dashboard",
        icon: <Home className="size-4" />,
        route: "/student/dashboard",
    },
    {
        title: "Lab Externals",
        icon: <FlaskConical className="size-4" />,
        route: "/student/lab-externals",
    },
];

export default function StudentSidebar() {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader
                className={cn(
                    "flex items-center justify-between p-4",
                    isCollapsed ? "flex-col gap-2" : "flex-row"
                )}
            >
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <span className="text-sm font-bold">B</span>
                    </div>
                    {!isCollapsed && (
                        <span className="font-semibold text-foreground">BuildIt</span>
                    )}
                </div>
                <SidebarTrigger />
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent className="px-2 py-4">
                <SidebarMenu>
                    {navigationItems.map((item) => (
                        <SidebarMenuItem key={item.route}>
                            <SidebarMenuButton asChild tooltip={item.title}>
                                <Link href={item.route}>
                                    {item.icon}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}