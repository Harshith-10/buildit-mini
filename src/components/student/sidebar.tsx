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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Home, FlaskConical } from "lucide-react";
import Link from "next/link";
import { Separator } from "@radix-ui/react-context-menu";

interface NavItem {
    title: string;
    icon: React.ReactNode;
    route: string;
}

const navigationItems: NavItem[] = [
    {
        title: "Dashboard",
        icon: <Home className="size-4" />,
        route: "/student",
    },
    {
        title: "Lab Externals",
        icon: <FlaskConical className="size-4" />,
        route: "/student/lab-externals",
    },
];

// Sample user data - replace with actual user data from your auth system
const userData = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "/avatars/user.png",
    fallback: "JD",
};

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

            <SidebarFooter className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className={cn(
                                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                                isCollapsed ? "justify-center" : ""
                            )}
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={userData.avatar} alt={userData.name} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {userData.fallback}
                                </AvatarFallback>
                            </Avatar>
                            {!isCollapsed && (
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-sm font-medium">{userData.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {userData.email}
                                    </span>
                                </div>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}