"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Exams</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No upcoming exams scheduled.</p>
        </CardContent>
      </Card>
    </div>
  );
}
