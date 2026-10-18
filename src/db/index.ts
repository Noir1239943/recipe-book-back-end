import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ENV } from "@/config/env";
import * as schema from "./schema";
if (!ENV.DATABASE_URL) throw new Error("DATABASE_URL is required");
export const pool = new Pool({ connectionString: ENV.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
