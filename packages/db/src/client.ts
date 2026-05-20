// 数据库连接管理

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// 创建 postgres 连接
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// 创建 drizzle 实例
export const db = drizzle(client, { schema });

// 优雅关闭
export async function closeDb() {
  await client.end();
}

export type Database = typeof db;
