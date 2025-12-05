"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, Loader2, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Question {
  id: string;
  title: string;
  description: string;
}

interface SelectedQuestion extends Question {
  marks: number;
}

const formSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  schedule: z.string().min(1, "Schedule is required"),
  duration: z.number().min(1, "Duration must be positive"),
  requirePassword: z.boolean(),
  accessPassword: z.string().optional(),
}).refine(
  (data) => {
    if (
      data.requirePassword &&
      (!data.accessPassword || data.accessPassword.length < 4)
    ) {
      return false;
    }
    return true;
  },
  {
    message: "Password must be at least 4 characters when enabled",
    path: ["accessPassword"],
  },
);

const LIMIT = 10;

interface CreateExternalDialogProps {
  onSuccess?: () => void;
}

export function CreateExternalDialog({ onSuccess }: CreateExternalDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const _router = useRouter();
  const [subjects, setSubjects] = useState<{ id: string; title: string }[]>([]);
  
  // Question selection state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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
    if (open) {
      fetch("/api/lab/subjects")
        .then((res) => res.json())
        .then((data) => setSubjects(data))
        .catch((err) => console.error(err));
      
      // Fetch questions when dialog opens
      setQuestions([]);
      setOffset(0);
      setSearch("");
      setSelectedQuestions([]);
      fetchQuestions("", 0);
    }
  }, [open, fetchQuestions]);

  // Debounced search for questions
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setOffset(0);
      fetchQuestions(search, 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, open, fetchQuestions]);

  const handleLoadMore = () => {
    fetchQuestions(search, offset, true);
  };

  const handleSelectQuestion = (question: Question) => {
    if (selectedQuestions.some((q) => q.id === question.id)) {
      // Already selected, remove it
      setSelectedQuestions((prev) => prev.filter((q) => q.id !== question.id));
    } else {
      // Add with default marks
      setSelectedQuestions((prev) => [...prev, { ...question, marks: 10 }]);
    }
  };

  const handleUpdateMarks = (questionId: string, marks: number) => {
    setSelectedQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, marks } : q))
    );
  };

  const handleRemoveQuestion = (questionId: string) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: "",
      schedule: "",
      duration: 180, // Default 3 hours
      requirePassword: false,
      accessPassword: "",
    },
  });

  const requirePassword = form.watch("requirePassword");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedQuestions.length === 0) {
      toast.error("Please select at least one question");
      return;
    }

    try {
      // Ensure schedule is ISO string
      const scheduleDate = new Date(values.schedule);

      const response = await fetch("/api/lab/externals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId: values.subjectId,
          duration: values.duration,
          schedule: scheduleDate.toISOString(),
          accessPassword: values.requirePassword
            ? values.accessPassword
            : undefined,
          questions: selectedQuestions.map((q) => ({
            questionId: q.id,
            marks: q.marks,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule exam");
      }

      toast.success("Exam scheduled successfully");
      setOpen(false);
      form.reset();
      setSelectedQuestions([]);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to schedule exam");
      console.error(error);
    }
  }

  const isQuestionSelected = (questionId: string) =>
    selectedQuestions.some((q) => q.id === questionId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Schedule Lab External</DialogTitle>
          <DialogDescription>
            Schedule a new external examination and select questions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule (Date & Time)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
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
                name="requirePassword"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-[72px]">
                    <div className="space-y-0.5">
                      <FormLabel>Password Protection</FormLabel>
                      <FormDescription className="text-xs">
                        Require password to access
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {requirePassword && (
              <FormField
                control={form.control}
                name="accessPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter exam password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Question Selection Section */}
            <div className="border rounded-lg p-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-base">Questions</FormLabel>
                <Badge variant="secondary">
                  {selectedQuestions.length} selected
                </Badge>
              </div>

              {/* Selected Questions */}
              {selectedQuestions.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-2 bg-primary/5 rounded-md p-2"
                    >
                      <span className="flex-1 text-sm truncate">{q.title}</span>
                      <Input
                        type="number"
                        value={q.marks}
                        onChange={(e) =>
                          handleUpdateMarks(q.id, Number(e.target.value))
                        }
                        className="w-20 h-8"
                        min={1}
                      />
                      <span className="text-xs text-muted-foreground">marks</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveQuestion(q.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Bar */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Questions List */}
              <ScrollArea className="flex-1 min-h-[150px] border rounded-md">
                {loadingQuestions ? (
                  <div className="flex items-center justify-center h-full py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : questions.length === 0 ? (
                  <div className="flex items-center justify-center h-full py-8 text-muted-foreground">
                    No questions found
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {questions.map((q) => (
                      <div
                        key={q.id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                          isQuestionSelected(q.id)
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => handleSelectQuestion(q)}
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="font-medium text-sm truncate">{q.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {q.description.substring(0, 60)}...
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant={isQuestionSelected(q.id) ? "default" : "outline"}
                          className="shrink-0 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectQuestion(q);
                          }}
                        >
                          {isQuestionSelected(q.id) ? (
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
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={selectedQuestions.length === 0}>
                Schedule Exam
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
