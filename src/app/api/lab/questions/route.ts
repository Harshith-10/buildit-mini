import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { labQuestions } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

const createQuestionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  examples: z.array(z.any()), // Define stricter schema if needed
  constraints: z.string().optional(),
  challenges: z.string().optional(),
  testCases: z.array(z.any()), // Define stricter schema if needed
  subjectId: z.string().optional(), // Optional initially, can be linked later
});

export async function GET() {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin", "student"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Students might only see questions assigned to them via external exams,
  // but for now let's assume they can list all or we filter later.
  // For this specific endpoint "Lab Questions" (library), usually only admins access it directly.
  // Students access "Lab Externals".
  // Let's restrict listing raw questions to admins for now.

  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const questions = await db.query.labQuestions.findMany({
    where: eq(labQuestions.isDeleted, false),
  });

  return NextResponse.json(questions);
}

export async function POST(req: Request) {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createQuestionSchema.parse(body);

    const newQuestion = await db
      .insert(labQuestions)
      .values({
        title: data.title,
        description: data.description,
        examples: data.examples,
        constraints: data.constraints,
        challenges: data.challenges,
        testCases: data.testCases,
        subjectId: data.subjectId,
      })
      .returning();

    return NextResponse.json(newQuestion[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request", details: error },
      { status: 400 },
    );
  }
}
