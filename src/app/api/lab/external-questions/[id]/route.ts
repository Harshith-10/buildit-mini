import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { labExternalQuestions } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await db
      .update(labExternalQuestions)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(eq(labExternalQuestions.id, id))
      .returning();

    if (!deleted.length) {
      return NextResponse.json(
        { error: "External question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete external question", details: error },
      { status: 500 }
    );
  }
}
