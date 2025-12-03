"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RecentActivity() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>You made 265 actions this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {[
            {
              id: "1",
              name: "Olivia Martin",
              email: "olivia.martin@email.com",
              action: "Created a new exam",
              time: "2m ago",
            },
            {
              id: "2",
              name: "Jackson Lee",
              email: "jackson.lee@email.com",
              action: "Updated question bank",
              time: "15m ago",
            },
            {
              id: "3",
              name: "Isabella Nguyen",
              email: "isabella.nguyen@email.com",
              action: "Registered new student",
              time: "1h ago",
            },
            {
              id: "4",
              name: "William Kim",
              email: "will@email.com",
              action: "Scheduled external exam",
              time: "3h ago",
            },
            {
              id: "5",
              name: "Sofia Davis",
              email: "sofia.davis@email.com",
              action: "Modified subject details",
              time: "5h ago",
            },
          ].map((item) => (
            <div key={item.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/avatars/01.png" alt="Avatar" />
                <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.action}</p>
              </div>
              <div className="ml-auto font-medium text-xs text-muted-foreground">
                {item.time}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
