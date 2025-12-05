"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Plus } from "lucide-react";
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
  FormDescription,
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
import { Switch } from "@/components/ui/switch";

const formSchema = z
  .object({
    subjectId: z.string().min(1, "Subject is required"),
    schedule: z.string().min(1, "Schedule is required"),
    duration: z.number().min(1, "Duration must be positive"),
    requirePassword: z.boolean().default(false),
    accessPassword: z.string().optional(),
  })
  .refine(
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

interface CreateExternalDialogProps {
  onSuccess?: () => void;
}

export function CreateExternalDialog({ onSuccess }: CreateExternalDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const _router = useRouter();
  const [subjects, setSubjects] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/lab/subjects")
        .then((res) => res.json())
        .then((data) => setSubjects(data))
        .catch((err) => console.error(err));
    }
  }, [open]);

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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule exam");
      }

      toast.success("Exam scheduled successfully");
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to schedule exam");
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Lab External</DialogTitle>
          <DialogDescription>
            Schedule a new external examination.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Password Protection</FormLabel>
                    <FormDescription className="text-xs">
                      Require students to enter a password to access the exam
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
                    <FormDescription className="text-xs">
                      Share this password with students to allow exam access
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="submit">Schedule</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
