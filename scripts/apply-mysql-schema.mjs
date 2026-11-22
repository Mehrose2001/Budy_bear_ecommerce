import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { arg, loadEnvFiles } from "./lib/migration-env.mjs";

loadEnvFiles();

if (!arg("--confirm-schema")) {
  console.error(
    "Refusing to apply schema without --confirm-schema. This creates tables with IF NOT EXISTS and does not drop data."
  );
  process.exit(2);
}

const sqlPath = path.join("backend", "mysql", "001_schema.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
  charset: "utf8mb4",
});

try {
  await connection.query(sql);
  console.log(`Applied ${sqlPath} to ${process.env.DB_NAME}@${process.env.DB_HOST}. Existing tables were not dropped.`);
} finally {
  await connection.end();
}
