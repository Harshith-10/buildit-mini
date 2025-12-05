"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BulkUploadDialog } from "@/components/admin/users/bulk-upload-dialog";
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

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users/list");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, [fetchUsers, fetchGroups]);

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
            <CreateGroupDialog onSuccess={fetchGroups} />
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
            <div className="flex gap-2">
              <BulkUploadDialog groups={groups} onSuccess={fetchUsers} />
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add User
              </Button>
            </div>
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
