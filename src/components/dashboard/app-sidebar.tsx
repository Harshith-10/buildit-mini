"use client";

import {
  BookOpen,
  Calendar,
  Command,
  GraduationCap,
  LayoutDashboard,
  Library,
  LifeBuoy,
  Send,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import type * as React from "react";
import ThemeToggle from "@/components/common/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUserRole } from "@/hooks/use-user-role";
import { NavUser } from "./nav-user";

// Menu items for Admin
const adminNavMain = [
  {
    title: "Platform",
    items: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Lab Subjects",
        url: "/admin/subjects",
        icon: BookOpen,
      },
      {
        title: "Question Bank",
        url: "/admin/questions",
        icon: Library,
      },
      {
        title: "Externals",
        url: "/admin/externals",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Users & Groups",
        url: "/admin/users",
        icon: Users,
      },
    ],
  },
];

// Menu items for Student
const studentNavMain = [
  {
    title: "Platform",
    items: [
      {
        title: "Dashboard",
        url: "/student/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "History",
        url: "/student/history",
        icon: GraduationCap,
      },
    ],
  },
];

const secondaryItems = [
  {
    title: "Support",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Feedback",
    url: "#",
    icon: Send,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role } = useUserRole();
  const pathname = usePathname();

  const navGroups =
    role === "admin" || role === "super_admin"
      ? adminNavMain
      : role === "student"
        ? studentNavMain
        : [];

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">BuildIT</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === item.url ||
                        pathname.startsWith(`${item.url}/`)
                      }
                      tooltip={item.title}
                    >
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="sm">
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between p-2">
          <ThemeToggle />
        </div>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
