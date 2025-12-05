import { NextResponse } from "next/server";
import { db } from "@/db";
import { getUserContext, requireRole } from "@/lib/proxy";

export async function GET() {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all users with their roles
    const allUsers = await db.query.user.findMany({
      orderBy: (user, { desc }) => [desc(user.createdAt)],
    });

    // Get student and admin mappings
    const allStudents = await db.query.students.findMany();
    const allAdmins = await db.query.admins.findMany();

    const studentUserIds = new Set(allStudents.map((s) => s.userId));
    const adminUserIds = new Set(allAdmins.map((a) => a.userId));
    const superAdminUserIds = new Set(
      allAdmins.filter((a) => a.isSuperAdmin).map((a) => a.userId),
    );

    // Map users with their roles
    const usersWithRoles = allUsers.map((u) => {
      let role: "super_admin" | "admin" | "student" | "user" = "user";
      if (superAdminUserIds.has(u.id)) {
        role = "super_admin";
      } else if (adminUserIds.has(u.id)) {
        role = "admin";
      } else if (studentUserIds.has(u.id)) {
        role = "student";
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role,
        createdAt: u.createdAt.toISOString().split("T")[0],
      };
    });

    return NextResponse.json(usersWithRoles);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
