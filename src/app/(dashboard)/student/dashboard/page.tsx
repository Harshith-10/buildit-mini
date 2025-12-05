"use client";

import { Calendar, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth-client";

type ExternalStatus = "Upcoming" | "Ongoing" | "Completed";

interface LabExternal {
  id: string;
  title: string;
  description: string | null;
  status: ExternalStatus;
  startDate: string;
  schedule: string;
  duration: number;
  subjectId: string;
}

interface DashboardData {
  externals: LabExternal[];
  stats: {
    ongoing: number;
    upcoming: number;
    completed: number;
    total: number;
  };
}

function getButtonText(status: ExternalStatus): string {
  switch (status) {
    case "Ongoing":
      return "Continue";
    case "Upcoming":
      return "View Details";
    case "Completed":
      return "View Results";
  }
}

function getButtonVariant(status: ExternalStatus): "primary" | "secondary" {
  return status === "Ongoing" || status === "Upcoming"
    ? "primary"
    : "secondary";
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/student/dashboard");
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    if (!dashboardData) {
      return [
        { label: "Ongoing Exams", value: "0" },
        { label: "Upcoming", value: "0" },
        { label: "Total Exams", value: "0" },
        { label: "Completed", value: "0" },
      ];
    }
    return [
      { label: "Ongoing Exams", value: String(dashboardData.stats.ongoing) },
      { label: "Upcoming", value: String(dashboardData.stats.upcoming) },
      { label: "Total Exams", value: String(dashboardData.stats.total) },
      { label: "Completed", value: String(dashboardData.stats.completed) },
    ];
  }, [dashboardData]);

  // Filter externals based on active tab and search query
  const filteredExternals = useMemo(() => {
    if (!dashboardData) return [];

    let filtered = dashboardData.externals;

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter(
        (external) => external.status.toLowerCase() === activeTab.toLowerCase(),
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (external) =>
          external.title.toLowerCase().includes(query) ||
          (external.description?.toLowerCase().includes(query) ?? false),
      );
    }

    return filtered;
  }, [dashboardData, activeTab, searchQuery]);

  const userName = session?.user?.name?.split(" ")[0] || "Student";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 max-w-[1200px] mx-auto w-full font-(family-name:--font-space-grotesk)">
      {/* Page Heading */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h1 className="text-foreground text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base font-normal leading-normal">
            Here&apos;s your progress and upcoming lab externals.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex flex-col gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-card p-4 sm:p-5 md:p-6 border border-border transition-all hover:border-border/80 hover:shadow-md dark:border-white/10 hover:dark:border-white/20"
          >
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base font-medium leading-normal">
              {stat.label}
            </p>
            <p className="text-card-foreground tracking-light text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
              {loading ? "-" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Lab Externals List Section */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Section Header */}
        <h2 className="text-foreground text-lg sm:text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em]">
          Lab Externals
        </h2>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 rounded-lg bg-muted p-1 overflow-x-auto">
            {["all", "upcoming", "ongoing", "completed"].map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-auto sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
            <input
              className="block w-full rounded-lg border border-input bg-background pl-9 sm:pl-10 pr-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="Search exams..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* External Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 pt-2 sm:pt-4">
          {filteredExternals.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
              <div className="text-muted-foreground text-center">
                <p className="text-lg font-semibold mb-2">No exams found</p>
                <p className="text-sm">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "No exams match the selected filter"}
                </p>
              </div>
            </div>
          ) : (
            filteredExternals.map((external) => (
              <div
                key={external.id}
                className="flex flex-col gap-3 sm:gap-4 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 bg-card border border-border hover:border-border/80 transition-all hover:shadow-lg h-full"
              >
                <div className="flex flex-col gap-3 sm:gap-4 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-card-foreground flex-1">
                      {external.title}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-primary/20 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-primary shrink-0">
                      {external.status}
                    </span>
                  </div>
                  {external.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                      {external.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">{external.startDate}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Duration: {external.duration} minutes
                  </div>
                </div>
                <button
                  type="button"
                  className={`w-full rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                    getButtonVariant(external.status) === "primary"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg active:scale-95"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95"
                  }`}
                >
                  {getButtonText(external.status)}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
