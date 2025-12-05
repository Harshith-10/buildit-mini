"use client";

import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParsedUser {
  name: string;
  email: string;
  rollNumber: string;
  batch?: string;
  branch?: string;
  section?: string;
}

interface UploadResult {
  success: { email: string; name: string }[];
  failed: { email: string; name: string; reason: string }[];
}

interface BulkUploadDialogProps {
  groups: { id: string; batch: string; branch: string; section: string }[];
  onSuccess?: () => void;
}

function parseCSV(csvText: string): ParsedUser[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have a header row and at least one data row");
  }

  const header = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim());

  // Required columns
  const nameIdx = header.findIndex(
    (h) => h === "name" || h === "full name" || h === "student name",
  );
  const emailIdx = header.findIndex(
    (h) => h === "email" || h === "email address",
  );
  const rollIdx = header.findIndex(
    (h) =>
      h === "roll" ||
      h === "roll number" ||
      h === "rollnumber" ||
      h === "roll_number",
  );

  if (nameIdx === -1 || emailIdx === -1 || rollIdx === -1) {
    throw new Error(
      "CSV must have columns: name, email, roll number (or variations)",
    );
  }

  // Optional columns
  const batchIdx = header.indexOf("batch");
  const branchIdx = header.indexOf("branch");
  const sectionIdx = header.indexOf("section");

  const users: ParsedUser[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields with commas
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const name = values[nameIdx]?.replace(/^"|"$/g, "");
    const email = values[emailIdx]?.replace(/^"|"$/g, "");
    const rollNumber = values[rollIdx]?.replace(/^"|"$/g, "");

    if (!name || !email || !rollNumber) {
      continue; // Skip invalid rows
    }

    users.push({
      name,
      email,
      rollNumber,
      batch:
        batchIdx !== -1 ? values[batchIdx]?.replace(/^"|"$/g, "") : undefined,
      branch:
        branchIdx !== -1 ? values[branchIdx]?.replace(/^"|"$/g, "") : undefined,
      section:
        sectionIdx !== -1
          ? values[sectionIdx]?.replace(/^"|"$/g, "")
          : undefined,
    });
  }

  return users;
}

export function BulkUploadDialog({ groups, onSuccess }: BulkUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }

      setFile(selectedFile);
      setResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          const users = parseCSV(csvText);
          setParsedUsers(users);
          toast.success(`Parsed ${users.length} users from CSV`);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to parse CSV",
          );
          setParsedUsers([]);
        }
      };
      reader.readAsText(selectedFile);
    },
    [],
  );

  const handleUpload = async () => {
    if (parsedUsers.length === 0) {
      toast.error("No users to upload");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch("/api/admin/users/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          users: parsedUsers,
          groupId: selectedGroup || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setResult(data.details);

      if (data.success > 0) {
        toast.success(`Successfully added ${data.success} users`);
        onSuccess?.();
      }

      if (data.failed > 0) {
        toast.warning(`${data.failed} users failed to upload`);
      }
    } catch (_error) {
      toast.error("Failed to upload users");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setParsedUsers([]);
    setSelectedGroup("");
    setResult(null);
  };

  const downloadTemplate = () => {
    const template =
      "name,email,roll_number,batch,branch,section\nJohn Doe,john@example.com,21A51A0501,2021,CSE,A\nJane Smith,jane@example.com,21A51A0502,2021,CSE,A";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Students</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple students at once. Default
            password: <code className="bg-muted px-1 rounded">password123</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Need a template?</span>
            </div>
            <Button variant="ghost" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>CSV File</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
              {file && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFile(null);
                    setParsedUsers([]);
                    setResult(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Group Selection */}
          <div className="space-y-2">
            <Label>Assign to Group (Optional)</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No group</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.batch} - {group.branch} - {group.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {parsedUsers.length > 0 && !result && (
            <div className="space-y-2">
              <Label>Preview ({parsedUsers.length} users)</Label>
              <ScrollArea className="h-[150px] rounded-md border p-2">
                <div className="space-y-1">
                  {parsedUsers.slice(0, 10).map((user, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                    >
                      <span className="font-medium">{user.name}</span>
                      <span className="text-muted-foreground">
                        {user.email}
                      </span>
                      <span className="text-muted-foreground">
                        {user.rollNumber}
                      </span>
                    </div>
                  ))}
                  {parsedUsers.length > 10 && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      ... and {parsedUsers.length - 10} more
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-2">
              <Label>Upload Results</Label>
              <ScrollArea className="h-[200px] rounded-md border p-2">
                <div className="space-y-2">
                  {result.success.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Successfully added ({result.success.length})
                      </div>
                      {result.success.map((user, idx) => (
                        <div
                          key={idx}
                          className="text-sm text-muted-foreground pl-5"
                        >
                          {user.name} - {user.email}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.failed.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center gap-1 text-sm font-medium text-red-600">
                        <XCircle className="h-4 w-4" />
                        Failed ({result.failed.length})
                      </div>
                      {result.failed.map((user, idx) => (
                        <div key={idx} className="text-sm pl-5">
                          <span className="text-muted-foreground">
                            {user.name} - {user.email}
                          </span>
                          <span className="text-red-500 text-xs ml-2">
                            ({user.reason})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={handleUpload}
              disabled={parsedUsers.length === 0 || uploading}
            >
              {uploading
                ? "Uploading..."
                : `Upload ${parsedUsers.length} Users`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
