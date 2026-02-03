const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Value from .env.local
// I will just hardcode the logic to read the file for simplicity in this script
// or I can ask the user to provide it.
// Better: Read .env.local manually.

const envPath = path.resolve(__dirname, "../.env.local");
let connectionString = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  for (const line of envConfig.split("\n")) {
    if (line.startsWith("DATABASE_URL=")) {
      connectionString = line.split("=")[1].trim();
      break;
    }
  }
}

if (!connectionString) {
  console.error("DATABASE_URL not found in environment or .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

const schemaPath = path.resolve(__dirname, "../schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running migration...");
    await client.query(schema);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
