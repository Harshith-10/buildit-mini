import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { admins, students } from "@/db/schema";
import { auth } from "@/lib/auth";

export type UserRole = "super_admin" | "admin" | "student" | "user";

export interface UserContext {
  user: typeof auth.$Infer.Session.user;
  role: UserRole;
  studentDetails?: typeof students.$inferSelect;
  adminDetails?: typeof admins.$inferSelect;
}

export async function getUserContext(): Promise<UserContext | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const userId = session.user.id;

  // Auto-promote specific user to super admin
  if (session.user.email?.toLowerCase() === "23951a052x@iare.ac.in") {
    const existingAdmin = await db.query.admins.findFirst({
      where: eq(admins.userId, userId),
    });

    if (!existingAdmin) {
      await db.insert(admins).values({
        userId: userId,
        facultyId: "SUPER_ADMIN",
        department: "ADMIN",
        isSuperAdmin: true,
      });
    }

    return {
      user: session.user,
      role: "super_admin",
      // We can optionally fetch admin details if they exist, but for now this grants access
    };
  }

  // Check if admin
  const adminRecord = await db.query.admins.findFirst({
    where: eq(admins.userId, userId),
  });

  if (adminRecord) {
    return {
      user: session.user,
      role: adminRecord.isSuperAdmin ? "super_admin" : "admin",
      adminDetails: adminRecord,
    };
  }

  // Check if student
  const studentRecord = await db.query.students.findFirst({
    where: eq(students.userId, userId),
  });

  if (studentRecord) {
    return {
      user: session.user,
      role: "student",
      studentDetails: studentRecord,
    };
  }

  // Default user
  return {
    user: session.user,
    role: "user",
  };
}

export function requireRole(
  context: UserContext | null,
  allowedRoles: UserRole[],
) {
  if (!context) {
    return false;
  }
  if (allowedRoles.includes(context.role)) {
    return true;
  }
  // Super admin can access everything admin can
  if (context.role === "super_admin" && allowedRoles.includes("admin")) {
    return true;
  }
  return false;
}
