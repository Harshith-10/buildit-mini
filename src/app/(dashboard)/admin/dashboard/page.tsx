"use client";

import { useEffect, useState } from "react";
import { OverviewChart } from "@/components/admin/dashboard/overview-chart";
import { RecentActivity } from "@/components/admin/dashboard/recent-activity";
import { StatsCards } from "@/components/admin/dashboard/stats-cards";

interface DashboardStats {
  subjects: number;
  questions: number;
  externals: number;
  upcomingExternals: number;
  users: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    subjects: 0,
    questions: 0,
    externals: 0,
    upcomingExternals: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/dashboard/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
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
