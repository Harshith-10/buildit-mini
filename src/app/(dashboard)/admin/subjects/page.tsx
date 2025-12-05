"use client";

import { useCallback, useEffect, useState } from "react";
import { columns, type LabSubject } from "@/components/admin/subjects/columns";
import { CreateSubjectDialog } from "@/components/admin/subjects/create-subject-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function LabSubjectsPage() {
  const [data, setData] = useState<LabSubject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/lab/subjects");
      if (res.ok) {
        const subjects = await res.json();
        setData(subjects);
      }
    } catch (error) {
      console.error("Failed to fetch subjects", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Lab Subjects</h1>
        <CreateSubjectDialog onSuccess={fetchData} />
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="title" />
      )}
    </div>
  );
}
