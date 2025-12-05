import { randomBytes, scryptSync } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { account, students, user } from "@/db/schema";
import { getUserContext, requireRole } from "@/lib/proxy";

const DEFAULT_PASSWORD = "password123";

// Scrypt config matching better-auth's implementation
const scryptConfig = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, scryptConfig.dkLen, {
    N: scryptConfig.N,
    r: scryptConfig.r,
    p: scryptConfig.p,
    maxmem: 128 * scryptConfig.N * scryptConfig.r * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

const userRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  rollNumber: z.string().min(1, "Roll number is required"),
  batch: z.string().optional(),
  branch: z.string().optional(),
  section: z.string().optional(),
});

const bulkUploadSchema = z.object({
  users: z.array(userRowSchema).min(1, "At least one user is required"),
  groupId: z.string().optional(), // Optional: assign all users to a group
});

export async function POST(req: Request) {
  const context = await getUserContext();
  if (!requireRole(context, ["admin", "super_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = bulkUploadSchema.parse(body);

    const hashedPassword = hashPassword(DEFAULT_PASSWORD);
    const results: {
      success: { email: string; name: string }[];
      failed: { email: string; name: string; reason: string }[];
    } = {
      success: [],
      failed: [],
    };

    for (const userData of data.users) {
      try {
        // Check if user already exists
        const existingUser = await db.query.user.findFirst({
          where: (users, { eq }) => eq(users.email, userData.email),
        });

        if (existingUser) {
          // Check if already a student
          const existingStudent = await db.query.students.findFirst({
            where: (students, { eq }) => eq(students.userId, existingUser.id),
          });

          if (existingStudent) {
            results.failed.push({
              email: userData.email,
              name: userData.name,
              reason: "User already exists as a student",
            });
            continue;
          }

          // User exists but not a student - add as student
          await db.insert(students).values({
            userId: existingUser.id,
            rollNumber: userData.rollNumber,
            status: "Studying",
            groupId: data.groupId || null,
          });

          results.success.push({
            email: userData.email,
            name: userData.name,
          });
          continue;
        }

        // Create new user
        const userId = crypto.randomUUID();
        const accountId = crypto.randomUUID();

        await db.insert(user).values({
          id: userId,
          name: userData.name,
          email: userData.email,
          emailVerified: false,
        });

        // Create account with password
        await db.insert(account).values({
          id: accountId,
          accountId: userId,
          providerId: "credential",
          userId: userId,
          password: hashedPassword,
        });

        // Create student record
        await db.insert(students).values({
          userId: userId,
          rollNumber: userData.rollNumber,
          status: "Studying",
          groupId: data.groupId || null,
        });

        results.success.push({
          email: userData.email,
          name: userData.name,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Check for unique constraint violation
        if (
          errorMessage.includes("unique") ||
          errorMessage.includes("duplicate")
        ) {
          results.failed.push({
            email: userData.email,
            name: userData.name,
            reason: "Duplicate email or roll number",
          });
        } else {
          results.failed.push({
            email: userData.email,
            name: userData.name,
            reason: errorMessage,
          });
        }
      }
    }

    return NextResponse.json({
      message: `Processed ${data.users.length} users`,
      success: results.success.length,
      failed: results.failed.length,
      details: results,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      { error: "Invalid request", details: error },
      { status: 400 },
    );
  }
}
