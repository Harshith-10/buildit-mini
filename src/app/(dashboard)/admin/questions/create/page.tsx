"use client";

import { useEffect, useState } from "react";
import { QuestionForm } from "@/components/admin/questions/question-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateQuestionPage() {
  const [subjects, setSubjects] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch("/api/lab/subjects");
        if (res.ok) {
          const data = await res.json();
          setSubjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch subjects", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSubjects();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">Create New Question</h1>
      <div className="border p-6 rounded-lg bg-card">
        <QuestionForm subjects={subjects} />
      </div>
    </div>
  );
}
