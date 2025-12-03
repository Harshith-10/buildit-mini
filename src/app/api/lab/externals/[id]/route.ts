import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { labExternals } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

const updateExternalSchema = z.object({
  subjectId: z.string().min(1).optional(),
  duration: z.number().int().positive().optional(),
  schedule: z.string().datetime().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin", "student"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const external = await db.query.labExternals.findFirst({
    where: eq(labExternals.id, id),
    with: {
      subject: true,
      questions: {
        with: {
          question: true,
        },
      },
    },
  });

  if (!external || external.isDeleted) {
    return NextResponse.json(
      { error: "External exam not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(external);
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
    const data = updateExternalSchema.parse(body);

    const updatedExternal = await db
      .update(labExternals)
      .set({
        ...data,
        schedule: data.schedule ? new Date(data.schedule) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(labExternals.id, id))
      .returning();

    if (!updatedExternal.length) {
      return NextResponse.json(
        { error: "External exam not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedExternal[0]);
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

  const deletedExternal = await db
    .update(labExternals)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
    })
    .where(eq(labExternals.id, id))
    .returning();

  if (!deletedExternal.length) {
    return NextResponse.json(
      { error: "External exam not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ message: "External exam deleted successfully" });
}
