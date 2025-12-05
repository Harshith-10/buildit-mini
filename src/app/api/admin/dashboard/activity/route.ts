import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { labExternals, labQuestions, labSubjects, user } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

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
  time: Date;
}

export async function GET() {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch recent users
    const recentUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(5);

    // Fetch recent questions
    const recentQuestions = await db
      .select({
        id: labQuestions.id,
        title: labQuestions.title,
        createdAt: labQuestions.createdAt,
      })
      .from(labQuestions)
      .orderBy(desc(labQuestions.createdAt))
      .limit(5);

    // Fetch recent subjects
    const recentSubjects = await db
      .select({
        id: labSubjects.id,
        title: labSubjects.title,
        createdAt: labSubjects.createdAt,
      })
      .from(labSubjects)
      .orderBy(desc(labSubjects.createdAt))
      .limit(5);

    // Fetch recent externals
    const recentExternals = await db.query.labExternals.findMany({
      orderBy: [desc(labExternals.createdAt)],
      limit: 5,
      with: {
        subject: true,
      },
    });

    // Combine and sort all activities
    const activities: Activity[] = [
      ...recentUsers.map((u) => ({
        id: u.id,
        type: "user_registered" as ActivityType,
        name: u.name,
        email: u.email,
        description: "Registered as a new user",
        time: u.createdAt,
      })),
      ...recentQuestions.map((q) => ({
        id: q.id,
        type: "question_created" as ActivityType,
        name: q.title,
        description: "Question added to bank",
        time: q.createdAt,
      })),
      ...recentSubjects.map((s) => ({
        id: s.id,
        type: "subject_created" as ActivityType,
        name: s.title,
        description: "New subject created",
        time: s.createdAt,
      })),
      ...recentExternals.map((e) => ({
        id: e.id,
        type: "external_scheduled" as ActivityType,
        name: e.subject?.title || "External Exam",
        description: `External scheduled for ${new Date(e.schedule).toLocaleDateString()}`,
        time: e.createdAt,
      })),
    ];

    // Sort by time descending and take top 10
    activities.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
    const recentActivities = activities.slice(0, 10);

    return NextResponse.json(recentActivities);
  } catch (error) {
    console.error("Failed to fetch recent activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 },
    );
  }
}
