import { randomBytes, scryptSync } from "node:crypto";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "../src/db/schema";

config({ path: ".env.local" });

// Default admin credentials
const DEFAULT_ADMIN = {
  email: "admin@iare.ac.in",
  password: "Admin@123", // Change this in production!
  name: "System Administrator",
};

// Scrypt config matching better-auth
const scryptConfig = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

/**
 * Hash password using scrypt (matching better-auth's implementation)
 * Format: salt:hash (both in hex)
 */
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

async function main() {
  console.log("🔐 Seeding default admin user...\n");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  const db = drizzle(client, { schema });

  try {
    // Check if admin user already exists
    const existingUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.email, DEFAULT_ADMIN.email),
    });

    if (existingUser) {
      console.log(
        "⚠️  Admin user already exists with email:",
        DEFAULT_ADMIN.email,
      );

      // Update the password hash
      const hashedPassword = hashPassword(DEFAULT_ADMIN.password);
      await db
        .update(schema.account)
        .set({ password: hashedPassword })
        .where(eq(schema.account.userId, existingUser.id));
      console.log("📝 Password hash updated.");

      // Check if they have admin role
      const existingAdmin = await db.query.admins.findFirst({
        where: (admins, { eq }) => eq(admins.userId, existingUser.id),
      });

      if (!existingAdmin) {
        console.log("📝 Adding admin role to existing user...");
        await db.insert(schema.admins).values({
          userId: existingUser.id,
          facultyId: "admin",
          department: "Administration",
          isSuperAdmin: true,
        });
        console.log("✅ Admin role added successfully!");
      } else if (!existingAdmin.isSuperAdmin) {
        console.log("📝 Upgrading to super admin...");
        await db
          .update(schema.admins)
          .set({ isSuperAdmin: true })
          .where(eq(schema.admins.userId, existingUser.id));
        console.log("✅ Upgraded to super admin!");
      } else {
        console.log("✅ User is already a super admin.");
      }

      console.log("\n📋 Admin Credentials:");
      console.log(`   Email: ${DEFAULT_ADMIN.email}`);
      console.log(`   Password: ${DEFAULT_ADMIN.password}`);

      await client.end();
      return;
    }

    // Create new user
    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(DEFAULT_ADMIN.password);

    console.log("📝 Creating admin user...");

    await db.insert(schema.user).values({
      id: userId,
      email: DEFAULT_ADMIN.email,
      name: DEFAULT_ADMIN.name,
      emailVerified: true,
    });

    // Create account with password (for email/password login)
    const accountId = crypto.randomUUID();
    await db.insert(schema.account).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
    });

    // Create admin record
    await db.insert(schema.admins).values({
      userId: userId,
      facultyId: "admin",
      department: "Administration",
      isSuperAdmin: true,
    });

    console.log("✅ Admin user created successfully!\n");
    console.log("📋 Admin Credentials:");
    console.log(`   Email: ${DEFAULT_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log("\n⚠️  Please change the password after first login!");
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(console.error);
