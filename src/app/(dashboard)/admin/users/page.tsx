"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type User,
  columns as userColumns,
} from "@/components/admin/users/columns";
import { CreateGroupDialog } from "@/components/admin/users/create-group-dialog";
import {
  columns as groupColumns,
  type StudentGroup,
} from "@/components/admin/users/groups-columns";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for users
const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "student",
    createdAt: "2023-01-15",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    role: "admin",
    createdAt: "2023-02-20",
  },
  {
    id: "3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    role: "student",
    createdAt: "2023-03-10",
  },
  {
    id: "4",
    name: "Diana Prince",
    email: "diana@example.com",
    role: "user",
    createdAt: "2023-04-05",
  },
  {
    id: "5",
    name: "Evan Wright",
    email: "evan@example.com",
    role: "student",
    createdAt: "2023-05-12",
  },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setUsers(MOCK_USERS);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoadingUsers(false);
      }
    }

    async function fetchGroups() {
      try {
        const res = await fetch("/api/admin/student-groups");
        if (res.ok) {
          const data = await res.json();
          setGroups(data);
        }
      } catch (error) {
        console.error("Failed to fetch groups", error);
      } finally {
        setLoadingGroups(false);
      }
    }

    fetchUsers();
    fetchGroups();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
      </div>
      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">Student Groups</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Manage student groups, batches, and sections.
            </div>
            <CreateGroupDialog />
          </div>
          {loadingGroups ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <DataTable columns={groupColumns} data={groups} searchKey="batch" />
          )}
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Manage all users, roles, and permissions.
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>
          {loadingUsers ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <DataTable columns={userColumns} data={users} searchKey="email" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
