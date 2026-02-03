const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

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

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Altering events table...");
    await client.query("ALTER TABLE events ALTER COLUMN distance TYPE TEXT;");
    console.log("Migration successful: distance column -> TEXT");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
