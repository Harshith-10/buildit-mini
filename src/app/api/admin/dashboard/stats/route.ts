import { and, count, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { labExternals, labQuestions, labSubjects, user } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

export async function GET() {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get counts from database
    const [subjectsResult] = await db
      .select({ count: count() })
      .from(labSubjects)
      .where(eq(labSubjects.isDeleted, false));

    const [questionsResult] = await db
      .select({ count: count() })
      .from(labQuestions)
      .where(eq(labQuestions.isDeleted, false));

    const [externalsResult] = await db
      .select({ count: count() })
      .from(labExternals)
      .where(eq(labExternals.isDeleted, false));

    const [usersResult] = await db.select({ count: count() }).from(user);

    // Get upcoming externals (scheduled in the future)
    const now = new Date();
    const [upcomingExternalsResult] = await db
      .select({ count: count() })
      .from(labExternals)
      .where(
        and(eq(labExternals.isDeleted, false), gte(labExternals.schedule, now)),
      );

    return NextResponse.json({
      subjects: subjectsResult?.count ?? 0,
      questions: questionsResult?.count ?? 0,
      externals: externalsResult?.count ?? 0,
      upcomingExternals: upcomingExternalsResult?.count ?? 0,
      users: usersResult?.count ?? 0,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
