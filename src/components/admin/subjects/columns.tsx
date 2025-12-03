"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type LabSubject = {
  id: string;
  title: string;
  description: string | null;
  batches: string[] | null;
  regulation: string | null;
  createdAt: string;
  updatedAt: string;
};

export const columns: ColumnDef<LabSubject>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "regulation",
    header: "Regulation",
  },
  {
    accessorKey: "batches",
    header: "Batches",
    cell: ({ row }) => {
      const batches = row.getValue("batches") as string[] | null;
      if (!batches || batches.length === 0) return <span>-</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {batches.map((batch) => (
            <Badge key={batch} variant="secondary">
              {batch}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const subject = row.original;

      return (
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
              onClick={() => navigator.clipboard.writeText(subject.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
