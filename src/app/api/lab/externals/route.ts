import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { labExternalQuestions, labExternals } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

const createExternalSchema = z.object({
  subjectId: z.string().min(1),
  duration: z.number().int().positive(),
  schedule: z.string().datetime(), // Expects ISO string
  accessPassword: z.string().optional(), // Optional password protection
  questions: z.array(z.object({
    questionId: z.string().min(1),
    marks: z.number().int().positive(),
  })).optional(),
});

export async function GET() {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin", "student"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Students should probably only see exams for their batch/group, but for now list all.
  // We can filter later based on context.studentDetails.groupId -> group -> batch -> subject -> external

  const externals = await db.query.labExternals.findMany({
    where: eq(labExternals.isDeleted, false),
    with: {
      subject: true,
    },
  });

  return NextResponse.json(externals);
}

export async function POST(req: Request) {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createExternalSchema.parse(body);

    const newExternal = await db
      .insert(labExternals)
      .values({
        subjectId: data.subjectId,
        duration: data.duration,
        schedule: new Date(data.schedule),
        accessPassword: data.accessPassword || null,
      })
      .returning();

    const externalId = newExternal[0].id;

    // Insert questions if provided
    if (data.questions && data.questions.length > 0) {
      await db.insert(labExternalQuestions).values(
        data.questions.map((q) => ({
          externalId,
          questionId: q.questionId,
          marks: q.marks,
        }))
      );
    }

    return NextResponse.json(newExternal[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request", details: error },
      { status: 400 },
    );
  }
}
