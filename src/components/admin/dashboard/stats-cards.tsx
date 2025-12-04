"use client";

import { BookOpen, Calendar, Library, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    subjects: number;
    questions: number;
    externals: number;
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
      trend: "+2.5%",
      description: "from last month",
    },
    {
      title: "Question Bank",
      value: stats.questions,
      icon: Library,
      trend: "+12%",
      description: "new questions",
    },
    {
      title: "Scheduled Exams",
      value: stats.externals,
      icon: Calendar,
      trend: "+4",
      description: "upcoming",
    },
    {
      title: "Total Users",
      value: stats.users,
      icon: Users,
      trend: "+8.1%",
      description: "active users",
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">
                    {item.trend}
                  </span>
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
