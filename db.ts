import { Database } from "sqlite";
import { open } from "sqlite";

let db: Database;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: "./shifthook.db",
      driver: require("sqlite3").Database,
    });
  }
  return db;
}

export async function initDb() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS managed_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sideshift_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      user_webhook_url TEXT NOT NULL,
      settle_address TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);
  // Trigger to auto-update updated_at timestamp
  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS set_timestamp
    BEFORE UPDATE ON managed_shifts
    FOR EACH ROW
    BEGIN
      UPDATE managed_shifts
      SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = OLD.id;
    END;
  `);
  console.log("Database initialized.");
}
