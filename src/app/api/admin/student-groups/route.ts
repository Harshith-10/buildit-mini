import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { studentGroups } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

const createGroupSchema = z.object({
  batch: z.string().min(1),
  branch: z.string().min(1),
  section: z.string().min(1),
  semester: z.number().int().positive(),
  regulation: z.string().min(1),
});

export async function GET() {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await db.query.studentGroups.findMany({
    where: eq(studentGroups.isDeleted, false),
  });

  return NextResponse.json(groups);
}

export async function POST(req: Request) {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createGroupSchema.parse(body);

    const newGroup = await db
      .insert(studentGroups)
      .values({
        batch: data.batch,
        branch: data.branch,
        section: data.section,
        semester: data.semester,
        regulation: data.regulation,
      })
      .returning();

    return NextResponse.json(newGroup[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request", details: error },
      { status: 400 },
    );
  }
}
