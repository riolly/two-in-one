import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URL ?? "postgres://postgres@localhost:5432/two_in_one",
});

export const db = drizzle(pool, {
  schema,
  casing: "snake_case",
});

