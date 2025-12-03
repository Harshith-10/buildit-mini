"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  columns,
  type LabQuestion,
} from "@/components/admin/questions/columns";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function LabQuestionsPage() {
  const [data, setData] = useState<LabQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/lab/questions");
        if (res.ok) {
          const questions = await res.json();
          setData(questions);
        }
      } catch (error) {
        console.error("Failed to fetch questions", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
        <Link href="/admin/questions/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </Link>
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
