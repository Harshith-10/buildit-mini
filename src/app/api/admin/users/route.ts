import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { admins, students } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

const promoteStudentSchema = z.object({
  userId: z.string(),
  rollNumber: z.string(),
  status: z.enum(["Studying", "Passout"]),
  groupId: z.string(),
});

const promoteAdminSchema = z.object({
  userId: z.string(),
  facultyId: z.string(),
  department: z.string(),
  isSuperAdmin: z.boolean().optional(),
  managedGroups: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const context = await getUserContext();
  if (!requireRole(context, ["super_admin"])) {
    // Only super admin can promote users
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, ...data } = body;

    if (type === "student") {
      const parsed = promoteStudentSchema.parse(data);
      const newStudent = await db
        .insert(students)
        .values({
          userId: parsed.userId,
          rollNumber: parsed.rollNumber,
          status: parsed.status,
          groupId: parsed.groupId,
        })
        .returning();
      return NextResponse.json(newStudent[0]);
    }

    if (type === "admin") {
      const parsed = promoteAdminSchema.parse(data);
      const newAdmin = await db
        .insert(admins)
        .values({
          userId: parsed.userId,
          facultyId: parsed.facultyId,
          department: parsed.department,
          isSuperAdmin: parsed.isSuperAdmin || false,
          managedGroups: parsed.managedGroups,
        })
        .returning();
      return NextResponse.json(newAdmin[0]);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request", details: error },
      { status: 400 },
    );
  }
}
