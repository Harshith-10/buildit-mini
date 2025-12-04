import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";

config({ path: ".env.local", quiet: true });

import * as schema from "./schema";

const db = drizzle(process.env.DATABASE_URL as string, { schema });

export { db };
