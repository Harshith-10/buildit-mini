import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

async function reset() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    console.log("Dropping schema public...");
    await client.query("DROP SCHEMA public CASCADE");

    console.log("Recreating schema public...");
    await client.query("CREATE SCHEMA public");

    console.log("Database reset complete");
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

reset();
