"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye, MoreHorizontal, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type LabExternal = {
  id: string;
  subject: {
    title: string;
  };
  duration: number;
  schedule: string;
  createdAt: string;
  updatedAt: string;
};

export const createColumns = (onDelete: (id: string) => Promise<void>): ColumnDef<LabExternal>[] => [
  {
    accessorKey: "subject.title",
    header: "Subject",
  },
  {
    accessorKey: "schedule",
    header: "Schedule",
    cell: ({ row }) => {
      const schedule = row.getValue("schedule") as string;
      return <span>{format(new Date(schedule), "PPpp")}</span>;
    },
  },
  {
    accessorKey: "duration",
    header: "Duration (mins)",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const external = row.original;

      const handleDelete = async () => {
        try {
          await onDelete(external.id);
          toast.success("External exam deleted successfully");
        } catch (error) {
          toast.error("Failed to delete external exam");
          console.error(error);
        }
      };

      return (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(external.id)}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/externals/${external.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Manage Questions
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-red-600">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the external exam for "{external.subject.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];
