import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { labSubjects } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

const updateSubjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  branches: z.array(z.string()).optional(),
  regulation: z.string().optional(),
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

  const subject = await db.query.labSubjects.findFirst({
    where: eq(labSubjects.id, id),
  });

  if (!subject || subject.isDeleted) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json(subject);
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
    const data = updateSubjectSchema.parse(body);

    const updatedSubject = await db
      .update(labSubjects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(labSubjects.id, id))
      .returning();

    if (!updatedSubject.length) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json(updatedSubject[0]);
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

  const deletedSubject = await db
    .update(labSubjects)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
    })
    .where(eq(labSubjects.id, id))
    .returning();

  if (!deletedSubject.length) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Subject deleted successfully" });
}
