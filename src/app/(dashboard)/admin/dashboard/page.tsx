"use client";

import { useEffect, useState } from "react";
import { OverviewChart } from "@/components/admin/dashboard/overview-chart";
import { RecentActivity } from "@/components/admin/dashboard/recent-activity";
import { StatsCards } from "@/components/admin/dashboard/stats-cards";

export default function AdminDashboardPage() {
  // TODO: Fetch real stats
  const [stats, setStats] = useState({
    subjects: 0,
    questions: 0,
    externals: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching stats
    setTimeout(() => {
      setStats({
        subjects: 5,
        questions: 120,
        externals: 2,
        users: 450,
      });
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          {/* Add DateRangePicker or Download button here if needed */}
        </div>
      </div>
      <div className="space-y-4">
        <StatsCards stats={stats} loading={loading} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <OverviewChart />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
