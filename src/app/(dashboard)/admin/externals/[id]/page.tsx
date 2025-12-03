"use client";

import { format } from "date-fns";
import { Trash } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddQuestionDialog } from "@/components/admin/externals/add-question-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExternalDetail {
  id: string;
  subject: {
    title: string;
  };
  duration: number;
  schedule: string;
  questions: {
    id: string;
    marks: number;
    duration: number | null;
    question: {
      title: string;
    };
  }[];
}

export default function ManageExternalPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ExternalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/lab/externals/${id}`);
        if (res.ok) {
          const external = await res.json();
          setData(external);
        }
      } catch (error) {
        console.error("Failed to fetch external details", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // TODO: Implement delete question functionality
  // const handleDeleteQuestion = async (questionId: string) => { ... }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!data) {
    return <div>External exam not found</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {data.subject.title} - External Exam
          </h1>
          <p className="text-muted-foreground">
            Scheduled for {format(new Date(data.schedule), "PPpp")} | Duration:{" "}
            {data.duration} mins
          </p>
        </div>
        <AddQuestionDialog externalId={id} />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question Title</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead>Duration Override</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.questions.length > 0 ? (
              data.questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">
                    {q.question.title}
                  </TableCell>
                  <TableCell>{q.marks}</TableCell>
                  <TableCell>
                    {q.duration ? `${q.duration} mins` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => toast.error("Delete not implemented yet")}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No questions added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
