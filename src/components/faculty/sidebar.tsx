"use client";

import { Collapsible, CollapsibleContent } from "@radix-ui/react-collapsible";
import {
  ChevronsUpDown,
  CircleQuestionMark,
  LayoutDashboard,
  Library,
  List,
  PenLine,
  Plus,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import Logo from "../common/logo";
import ThemeToggle from "../common/theme-toggle";
import UserCard from "../common/user-card";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  submenu?: MenuItem[];
}

const application_items: MenuItem[] = [
  {
    icon: <LayoutDashboard />,
    label: "Dashboard",
    href: "/faculty/dashboard",
  },
  {
    icon: <Plus />,
    label: "Create",
    submenu: [
      {
        icon: <CircleQuestionMark />,
        label: "Question",
        href: "/faculty/create/question",
      },
      {
        icon: <List />,
        label: "Collection",
        href: "/faculty/create/collection",
      },
      {
        icon: <Library />,
        label: "Test",
        href: "/faculty/create/test",
      },
      {
        icon: <PenLine />,
        label: "Lab External",
        href: "/faculty/create/lab-external",
      },
    ],
  },
];

const explore_items: MenuItem[] = [
  {
    icon: <CircleQuestionMark />,
    label: "Questions",
    href: "/faculty/questions",
  },
  {
    icon: <List />,
    label: "Collections",
    href: "/faculty/collections",
  },
  {
    icon: <Library />,
    label: "Tests",
    href: "/faculty/tests",
  },
  {
    icon: <PenLine />,
    label: "Lab External",
    href: "/faculty/lab-external",
  },
];

export function FacultySidebar() {
  const { open, state } = useSidebar();
  const currentRoute = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-none">
      <SidebarHeader>
        <div className={`flex items-center gap-2 ${!open && "flex-col"}`}>
          <Logo className="h-8 w-8" />
          <h1
            className={`text-2xl font-bold ${state === "expanded" ? "flex-1" : "hidden"}`}
          >
            BuildIT
          </h1>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            {application_items.map((item: MenuItem) => (
              <RecursiveSidebarItem
                item={item}
                currentRoute={currentRoute}
                key={item.label}
              />
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            {explore_items.map((item: MenuItem) => (
              <RecursiveSidebarItem
                item={item}
                currentRoute={currentRoute}
                key={item.label}
              />
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
        <UserCard size={open ? "default" : "sm"} />
      </SidebarFooter>
    </Sidebar>
  );
}

function RecursiveSidebarItem({
  item,
  currentRoute,
}: {
  item: MenuItem;
  currentRoute: string;
}) {
  return (
    <SidebarMenu key={item.label}>
      {item.submenu ? (
        <Collapsible className="group/collapsible">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton>
              {item.icon}
              <span className="flex-1">{item.label}</span>
              <ChevronsUpDown />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="collapsible-content">
            <SidebarMenuSub>
              {item.submenu.map((submenuItem: MenuItem) => (
                <RecursiveSidebarItem
                  item={submenuItem}
                  currentRoute={currentRoute}
                  key={submenuItem.label}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <a href={item.href}>
              {item.icon}
              <span>{item.label}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
