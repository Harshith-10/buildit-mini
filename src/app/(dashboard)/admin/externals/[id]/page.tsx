"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Check, Loader2, Plus, Search, Trash, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      id: string;
      title: string;
    };
  }[];
}

interface Question {
  id: string;
  title: string;
  description: string;
}

const formSchema = z.object({
  questionId: z.string().min(1, "Question is required"),
  marks: z.number().min(1, "Marks must be positive"),
  duration: z.number().optional(),
});

const LIMIT = 10;

export default function ManageExternalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<ExternalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add question dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchExternalData = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchExternalData();
  }, [fetchExternalData]);

  const fetchQuestions = useCallback(async (searchQuery: string, currentOffset: number, append = false) => {
    const isLoadingMore = append;
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoadingQuestions(true);
    }
    
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        limit: String(LIMIT),
        offset: String(currentOffset),
      });
      const res = await fetch(`/api/lab/questions?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setQuestions((prev) => [...prev, ...data.questions]);
        } else {
          setQuestions(data.questions);
        }
        setHasMore(data.hasMore);
        setOffset(currentOffset + data.questions.length);
      }
    } catch (err) {
      console.error("Failed to fetch questions", err);
    } finally {
      setLoadingQuestions(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      setQuestions([]);
      setOffset(0);
      setSearch("");
      setSelectedQuestion(null);
      fetchQuestions("", 0);
    }
  }, [dialogOpen, fetchQuestions]);

  // Debounced search for questions
  useEffect(() => {
    if (!dialogOpen) return;
    const timer = setTimeout(() => {
      setOffset(0);
      fetchQuestions(search, 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, dialogOpen, fetchQuestions]);

  const handleLoadMore = () => {
    fetchQuestions(search, offset, true);
  };

  const handleSelectQuestion = (question: Question) => {
    setSelectedQuestion(question);
    form.setValue("questionId", question.id);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      questionId: "",
      marks: 10,
      duration: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch(`/api/lab/externals/${id}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to add question");
      }

      toast.success("Question added successfully");
      setDialogOpen(false);
      form.reset();
      setSelectedQuestion(null);
      fetchExternalData();
    } catch (error) {
      toast.error("Failed to add question");
      console.error(error);
    }
  }

  // Get already added question IDs
  const addedQuestionIds = data?.questions.map((q) => q.question.id) || [];
  const availableQuestions = questions.filter((q) => !addedQuestionIds.includes(q.id));

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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Question to Exam</DialogTitle>
              <DialogDescription>
                Search and select a question from the bank to add to this exam.
              </DialogDescription>
            </DialogHeader>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Questions List */}
            <ScrollArea className="h-[250px] border rounded-md">
              {loadingQuestions ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableQuestions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No questions found
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {availableQuestions.map((q) => (
                    <div
                      key={q.id}
                      className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                        selectedQuestion?.id === q.id
                          ? "bg-primary/10 border border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleSelectQuestion(q)}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium truncate">{q.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {q.description.substring(0, 80)}...
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant={selectedQuestion?.id === q.id ? "default" : "outline"}
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectQuestion(q);
                        }}
                      >
                        {selectedQuestion?.id === q.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Selected Question Info */}
            {selectedQuestion && (
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-sm font-medium">Selected: {selectedQuestion.title}</p>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...form.register("questionId")} />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="marks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marks</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration Override (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Minutes"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedQuestion}>
                    Add Question
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
