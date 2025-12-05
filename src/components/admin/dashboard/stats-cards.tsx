"use client";

import { BookOpen, Calendar, Library, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    subjects: number;
    questions: number;
    externals: number;
    upcomingExternals?: number;
    users: number;
  };
  loading: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const items = [
    {
      title: "Total Subjects",
      value: stats.subjects,
      icon: BookOpen,
      description: "lab subjects",
    },
    {
      title: "Question Bank",
      value: stats.questions,
      icon: Library,
      description: "total questions",
    },
    {
      title: "Scheduled Exams",
      value: stats.externals,
      icon: Calendar,
      description: stats.upcomingExternals
        ? `${stats.upcomingExternals} upcoming`
        : "lab externals",
    },
    {
      title: "Total Users",
      value: stats.users,
      icon: Users,
      description: "registered users",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
