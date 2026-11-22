import mysql from "mysql2/promise";
import { isMysqlConfigured } from "@/lib/backendMode";

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

let pool;

export function mysqlConfig() {
  const env = typeof process === "undefined" ? {} : process.env;
  return {
    host: clean(env.DB_HOST) || "127.0.0.1",
    port: Number(clean(env.DB_PORT) || 3306),
    user: clean(env.DB_USER),
    password: clean(env.DB_PASSWORD),
    database: clean(env.DB_NAME),
    waitForConnections: true,
    connectionLimit: Math.min(10, Math.max(2, Number(clean(env.DB_POOL_SIZE) || 8))),
    queueLimit: 0,
    enableKeepAlive: true,
    charset: "utf8mb4",
    timezone: "Z",
    dateStrings: false,
  };
}

export function getMysqlPool() {
  if (!isMysqlConfigured()) {
    throw new Error("Hostinger MySQL is not configured. Set DB_HOST, DB_USER, and DB_NAME.");
  }
  if (!pool) {
    pool = mysql.createPool(mysqlConfig());
  }
  return pool;
}

export async function query(sql, params = []) {
  const [rows] = await getMysqlPool().execute(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function withTransaction(work) {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function pingMysql() {
  if (!isMysqlConfigured()) return { ok: false, reason: "not_configured" };
  try {
    await query("SELECT 1 AS ok");
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message || "connection_failed" };
  }
}
