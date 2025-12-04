import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { labSubjects } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

const createSubjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  batches: z.array(z.string()).optional(),
  regulation: z.string().optional(),
});

export async function GET() {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin", "student"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subjects = await db.query.labSubjects.findMany({
    where: eq(labSubjects.isDeleted, false),
  });

  return NextResponse.json(subjects);
}

export async function POST(req: Request) {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createSubjectSchema.parse(body);

    const newSubject = await db
      .insert(labSubjects)
      .values({
        title: data.title,
        description: data.description,
        batches: data.batches,
        regulation: data.regulation,
      })
      .returning();

    return NextResponse.json(newSubject[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request", details: error },
      { status: 400 },
    );
  }
}
