"use client";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  FileCode,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LabExternal {
  id: string;
  duration: number;
  schedule: string;
  subject: {
    id: string;
    title: string;
    description?: string;
  };
  questions: Array<{
    id: string;
    marks: number;
    question: {
      id: string;
      title: string;
      description: string;
    };
  }>;
}

export default function LabExternalsPage() {
  const router = useRouter();
  const [externals, setExternals] = useState<LabExternal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExternals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/lab/externals");
        if (!response.ok) {
          throw new Error("Failed to load exams");
        }

        const data = await response.json();
        setExternals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load exams");
      } finally {
        setIsLoading(false);
      }
    };

    loadExternals();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExamStatus = (schedule: string, duration: number) => {
    const now = new Date();
    const start = new Date(schedule);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    if (now < start) {
      return { status: "upcoming", label: "Upcoming" };
    } else if (now >= start && now <= end) {
      return { status: "ongoing", label: "Ongoing" };
    } else {
      return { status: "completed", label: "Completed" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Lab Externals</h1>
        <p className="text-muted-foreground mt-1">
          View and attempt your lab external examinations
        </p>
      </div>

      {/* Exams List */}
      {externals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Exams Available</h3>
            <p className="text-muted-foreground text-center">
              There are no lab external exams scheduled for you at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {externals.map((external) => {
            const { status, label } = getExamStatus(
              external.schedule,
              external.duration,
            );

            return (
              <Card key={external.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {external.subject.title}
                      </CardTitle>
                      {external.subject.description && (
                        <CardDescription className="mt-1">
                          {external.subject.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant={
                        status === "ongoing"
                          ? "default"
                          : status === "upcoming"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Exam Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(external.schedule)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{external.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileCode className="h-4 w-4" />
                      <span>{external.questions?.length || 0} questions</span>
                    </div>
                  </div>

                  {/* Questions List */}
                  {status === "ongoing" && external.questions?.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/30 px-4 py-2 text-sm font-medium">
                        Questions
                      </div>
                      <ScrollArea className="max-h-[200px]">
                        <div className="divide-y">
                          {external.questions.map((eq, idx) => (
                            <div
                              key={eq.id}
                              className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">
                                  Q{idx + 1}
                                </span>
                                <span className="font-medium">
                                  {eq.question.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">
                                  {eq.marks} marks
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/student/lab-externals/${external.id}/${eq.question.id}`,
                                    )
                                  }
                                >
                                  Attempt
                                  <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Action Button for upcoming/completed */}
                  {status !== "ongoing" && (
                    <div className="pt-2">
                      <Button
                        variant={
                          status === "upcoming" ? "outline" : "secondary"
                        }
                        disabled={status === "completed"}
                        className="w-full sm:w-auto"
                      >
                        {status === "upcoming"
                          ? "View Details"
                          : "View Submissions"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
