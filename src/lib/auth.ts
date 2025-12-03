import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import nodemailer from "nodemailer";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { parseRollNumber } from "./jntu";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(_data, _request) {
      // Send an email to the user with a link to reset their password
      
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          console.log("Attempting to create user:", user.email);
          if (!user.email.endsWith("@iare.ac.in")) {
            // Throwing error to block creation
            // BetterAuth should catch this and return an error to client
            throw new Error("Only @iare.ac.in emails are allowed.");
          }
          return {
            data: user,
          };
        },
        after: async (user) => {
          const username = user.email.split("@")[0];

          if (user.email === "23951A052X@iare.ac.in") {
            await db.insert(schema.admins).values({
              userId: user.id,
              facultyId: username,
              department: "CSE",
              isSuperAdmin: true,
            });
            return;
          }

          const rollNumberDetails = parseRollNumber(username);

          if (rollNumberDetails?.isValid) {
            // It's a student
            await db.insert(schema.students).values({
              userId: user.id,
              rollNumber: rollNumberDetails.fullString,
              status: "Studying", // Default status
              // groupId is null initially
            });
          } else {
            // It's an admin/faculty
            await db.insert(schema.admins).values({
              userId: user.id,
              facultyId: username, // Use username as default faculty ID
              department: "Unknown", // Default department
              isSuperAdmin: false,
            });
          }
        },
      },
    },
  },
});
