"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  questionId: z.string().min(1, "Question is required"),
  marks: z.number().min(1, "Marks must be positive"),
  duration: z.number().optional(),
});

interface AddQuestionDialogProps {
  externalId: string;
}

export function AddQuestionDialog({ externalId }: AddQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [questions, setQuestions] = useState<{ id: string; title: string }[]>(
    [],
  );

  useEffect(() => {
    if (open) {
      fetch("/api/lab/questions")
        .then((res) => res.json())
        .then((data) => setQuestions(data))
        .catch((err) => console.error(err));
    }
  }, [open]);

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
      const response = await fetch(
        `/api/lab/externals/${externalId}/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to add question");
      }

      toast.success("Question added successfully");
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error("Failed to add question");
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Question to Exam</DialogTitle>
          <DialogDescription>
            Select a question from the bank to add to this exam.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="questionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a question" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {questions.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.title}
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
            <DialogFooter>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
