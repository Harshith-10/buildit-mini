import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { labExternals } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

export type ExternalStatus = "Upcoming" | "Ongoing" | "Completed";

interface ExternalExam {
  id: string;
  title: string;
  description: string | null;
  status: ExternalStatus;
  startDate: string;
  schedule: string;
  duration: number;
  subjectId: string;
}

function getExternalStatus(schedule: Date, duration: number): ExternalStatus {
  const now = new Date();
  const startTime = new Date(schedule);
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  if (now < startTime) {
    return "Upcoming";
  } else if (now >= startTime && now <= endTime) {
    return "Ongoing";
  } else {
    return "Completed";
  }
}

function formatStartDate(schedule: Date, status: ExternalStatus): string {
  const now = new Date();
  const diffMs = schedule.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (status === "Upcoming") {
    if (diffDays > 7) {
      return `Starts ${schedule.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else if (diffDays > 1) {
      return `Starts in ${diffDays} days`;
    } else if (diffDays === 1) {
      return "Starts tomorrow";
    } else if (diffHours > 0) {
      return `Starts in ${diffHours} hours`;
    } else {
      return "Starting soon";
    }
  } else if (status === "Ongoing") {
    const endMs = diffMs * -1; // Time since start
    const endHours = Math.floor(endMs / (1000 * 60 * 60));
    if (endHours < 1) {
      return "Just started";
    }
    return `Started ${endHours}h ago`;
  } else {
    const endedMs = now.getTime() - schedule.getTime();
    const endedDays = Math.floor(endedMs / (1000 * 60 * 60 * 24));
    if (endedDays < 1) {
      return "Ended today";
    } else if (endedDays < 7) {
      return `Ended ${endedDays} day${endedDays > 1 ? "s" : ""} ago`;
    } else if (endedDays < 30) {
      const weeks = Math.floor(endedDays / 7);
      return `Ended ${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else {
      const months = Math.floor(endedDays / 30);
      return `Ended ${months} month${months > 1 ? "s" : ""} ago`;
    }
  }
}

export async function GET() {
  const context = await getUserContext();
  if (!requireRole(context, ["student", "admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const _now = new Date();

    // Fetch all externals with their subjects
    const externals = await db.query.labExternals.findMany({
      where: eq(labExternals.isDeleted, false),
      with: {
        subject: true,
      },
      orderBy: (externals, { desc }) => [desc(externals.schedule)],
    });

    // Transform externals to include status
    const externalExams: ExternalExam[] = externals.map((external) => {
      const status = getExternalStatus(external.schedule, external.duration);
      return {
        id: external.id,
        title: external.subject?.title || "Lab External",
        description: external.subject?.description || null,
        status,
        startDate: formatStartDate(external.schedule, status),
        schedule: external.schedule.toISOString(),
        duration: external.duration,
        subjectId: external.subjectId,
      };
    });

    // Calculate stats
    const stats = {
      ongoing: externalExams.filter((e) => e.status === "Ongoing").length,
      upcoming: externalExams.filter((e) => e.status === "Upcoming").length,
      completed: externalExams.filter((e) => e.status === "Completed").length,
      total: externalExams.length,
    };

    return NextResponse.json({
      externals: externalExams,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch student dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
