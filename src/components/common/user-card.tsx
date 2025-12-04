import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserRole } from "@/hooks/use-user-role";
import { authClient } from "@/lib/auth-client";

interface UserCardProps {
  size?: "default" | "sm";
}

export default function UserCard({ size = "default" }: UserCardProps) {
  const { data } = useUserRole();
  const router = useRouter();
  const user = data?.user;

  if (!user) return null;

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer">
          {size === "default" ? (
            <div className="w-full flex bg-background items-center gap-2 rounded border p-2 hover:bg-accent transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-border uppercase">
                  {user.name?.slice(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden text-left">
                <p className="font-bold truncate text-sm">{user.name}</p>
                <p className="text-muted-foreground text-xs truncate">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="icon" className="p-0 h-10 w-10">
              <Avatar className="h-full w-full">
                <AvatarFallback className="bg-border rounded h-full w-full uppercase">
                  {user.name?.slice(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
