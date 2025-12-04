import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "../src/db/schema";

config({ path: ".env.local" });

async function main() {
  const rollNumber = process.argv[2];

  if (!rollNumber) {
    console.error("Please provide a roll number as an argument.");
    console.log("Usage: pnpx tsx scripts/make-admin-by-roll.ts <roll_number>");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  const db = drizzle(client, { schema });

  try {
    console.log(`Looking for student with roll number: ${rollNumber}`);
    const student = await db.query.students.findFirst({
      where: eq(schema.students.rollNumber, rollNumber),
    });

    if (!student) {
      console.error("Student not found!");
      process.exit(1);
    }

    console.log(`Found student linked to User ID: ${student.userId}`);

    const existingAdmin = await db.query.admins.findFirst({
      where: eq(schema.admins.userId, student.userId),
    });

    if (existingAdmin) {
      console.log("User is already an admin. Updating to super admin...");
      await db
        .update(schema.admins)
        .set({ isSuperAdmin: true })
        .where(eq(schema.admins.userId, student.userId));
    } else {
      console.log("Promoting user to super admin...");
      await db.insert(schema.admins).values({
        userId: student.userId,
        facultyId: rollNumber, // Use roll number as faculty ID for students-turned-admins
        department: "STUDENT_ADMIN",
        isSuperAdmin: true,
      });
    }

    console.log("Successfully promoted user to super admin!");
  } catch (error) {
    console.error("Error promoting user:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
