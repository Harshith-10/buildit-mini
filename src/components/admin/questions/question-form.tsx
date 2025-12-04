"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DynamicList } from "@/components/ui/dynamic-list";
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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  constraints: z.string().optional(),
  challenges: z.string().optional(),
  subjectId: z.string().optional(),
});

interface QuestionFormProps {
  initialData?: {
    title?: string;
    description?: string;
    constraints?: string;
    challenges?: string;
    subjectId?: string;
    examples?: { input: string; output: string }[];
    testCases?: { input: string; output: string }[];
  };
  subjects: { id: string; title: string }[];
  onSuccess?: () => void;
}

export function QuestionForm({
  initialData,
  subjects,
  onSuccess,
}: QuestionFormProps) {
  const router = useRouter();
  const [examples, setExamples] = useState<{ input: string; output: string }[]>(
    initialData?.examples || [],
  );
  const [testCases, setTestCases] = useState<
    { input: string; output: string }[]
  >(initialData?.testCases || []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      constraints: initialData?.constraints || "",
      challenges: initialData?.challenges || "",
      subjectId: initialData?.subjectId || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        ...values,
        examples,
        testCases,
      };

      const response = await fetch("/api/lab/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save question");
      }

      toast.success("Question saved successfully");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/questions");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to save question");
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Two Sum" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Problem description..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DynamicList
            items={examples}
            setItems={setExamples}
            label="Examples (Visible to students)"
          />
          <DynamicList
            items={testCases}
            setItems={setTestCases}
            label="Test Cases (Hidden)"
          />
        </div>

        <FormField
          control={form.control}
          name="constraints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Constraints</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g. 1 <= n <= 10^5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="challenges"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Challenges</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional challenges..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Save Question
        </Button>
      </form>
    </Form>
  );
}
