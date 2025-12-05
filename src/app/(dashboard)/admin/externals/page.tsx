"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createColumns,
  type LabExternal,
} from "@/components/admin/externals/columns";
import { CreateExternalDialog } from "@/components/admin/externals/create-external-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function LabExternalsPage() {
  const [data, setData] = useState<LabExternal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/lab/externals");
      if (res.ok) {
        const externals = await res.json();
        setData(externals);
      }
    } catch (error) {
      console.error("Failed to fetch externals", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/lab/externals/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete external exam");
    }
    await fetchData();
  }, [fetchData]);

  const columns = useMemo(() => createColumns(handleDelete), [handleDelete]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Lab Externals</h1>
        <CreateExternalDialog onSuccess={fetchData} />
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="subject.title" />
      )}
    </div>
  );
}
