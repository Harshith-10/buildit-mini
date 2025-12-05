"use client";

import { BookOpen, Calendar, FileQuestion, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ActivityType =
  | "user_registered"
  | "question_created"
  | "subject_created"
  | "external_scheduled";

interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  email?: string;
  description: string;
  time: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "user_registered":
      return <UserPlus className="h-4 w-4" />;
    case "question_created":
      return <FileQuestion className="h-4 w-4" />;
    case "subject_created":
      return <BookOpen className="h-4 w-4" />;
    case "external_scheduled":
      return <Calendar className="h-4 w-4" />;
    default:
      return null;
  }
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch("/api/admin/dashboard/activity");
        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, []);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          {activities.length > 0
            ? `${activities.length} recent activities`
            : "No recent activity"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="ml-4 space-y-1 flex-1">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[200px]" />
                </div>
                <Skeleton className="h-3 w-[50px]" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity to display
          </div>
        ) : (
          <div className="space-y-8">
            {activities.map((item) => (
              <div key={item.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10">
                    {getActivityIcon(item.type)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <div className="ml-auto font-medium text-xs text-muted-foreground">
                  {formatTimeAgo(new Date(item.time))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
