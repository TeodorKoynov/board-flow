import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { join } from "path";

const dataDir = join(import.meta.dir, "../../data");
mkdirSync(dataDir, { recursive: true });

const DB_PATH = join(dataDir, "boardflow.db");
const db = new Database(DB_PATH, { create: true });

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

export default db;
