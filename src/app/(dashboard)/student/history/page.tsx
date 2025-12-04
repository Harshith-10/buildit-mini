"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentHistoryPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Exam History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Past Exams</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No past exams found.</p>
        </CardContent>
      </Card>
    </div>
  );
}
