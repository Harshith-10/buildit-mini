import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { labExternalQuestions } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

const addQuestionSchema = z.object({
  questionId: z.string().min(1),
  marks: z.number().int().positive(),
  duration: z.number().int().positive().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // externalId
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = addQuestionSchema.parse(body);

    const newExternalQuestion = await db
      .insert(labExternalQuestions)
      .values({
        externalId: id,
        questionId: data.questionId,
        marks: data.marks,
        duration: data.duration,
      })
      .returning();

    return NextResponse.json(newExternalQuestion[0]);
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
  const { id } = await params; // externalId
  // This DELETE is tricky because we need the specific labExternalQuestion ID, not just externalId.
  // But the route is /api/lab/externals/[id]/questions.
  // Usually we'd pass the question link ID in the body or query param, or have a separate route /api/lab/external-questions/[id].
  // Let's assume we pass the `labExternalQuestionId` in the body or query for now, OR we just make a separate route.
  // Actually, let's make a separate route for deleting/updating specific external question links: /api/lab/external-questions/[id]
  // But for now, let's just support adding here.

  return NextResponse.json(
    {
      error:
        "Method not allowed. Use /api/lab/external-questions/[id] to delete.",
    },
    { status: 405 },
  );
}
