import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { labQuestions } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

const updateQuestionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  examples: z.array(z.any()).optional(),
  constraints: z.string().optional(),
  challenges: z.string().optional(),
  testCases: z.array(z.any()).optional(),
  subjectId: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const question = await db.query.labQuestions.findFirst({
    where: eq(labQuestions.id, id),
  });

  if (!question || question.isDeleted) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json(question);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateQuestionSchema.parse(body);

    const updatedQuestion = await db
      .update(labQuestions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(labQuestions.id, id))
      .returning();

    if (!updatedQuestion.length) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedQuestion[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request", details: error },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Soft delete
  const deletedQuestion = await db
    .update(labQuestions)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
    })
    .where(eq(labQuestions.id, id))
    .returning();

  if (!deletedQuestion.length) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Question deleted successfully" });
}
