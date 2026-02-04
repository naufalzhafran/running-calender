const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load env vars from .env.local if not in environment
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(__dirname, "../.env.local");
    const envConfig = fs.readFileSync(envPath, "utf8");
    envConfig.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    });
  } catch (e) {
    console.error("Could not load .env.local", e);
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting migration...");
    await client.query("BEGIN");

    // 1. Add end_date column if it doesn't exist
    console.log("Checking end_date column...");
    await client.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS end_date TIMESTAMP;
    `);

    // 2. Check if distance is already JSONB
    const res = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = 'distance';
    `);

    const currentType = res.rows[0]?.data_type;
    console.log(`Current distance column type: ${currentType}`);

    if (currentType !== "jsonb") {
      console.log("Migrating distance column to JSONB...");

      // Rename current distance to old_distance
      await client.query(
        "ALTER TABLE events RENAME COLUMN distance TO old_distance;",
      );

      // Add new distance column
      await client.query(
        "ALTER TABLE events ADD COLUMN distance JSONB DEFAULT '[]'::jsonb;",
      );

      // Migrate data
      const eventsRes = await client.query(
        "SELECT id, old_distance, event_date FROM events",
      );

      for (const event of eventsRes.rows) {
        const oldDistStr = event.old_distance || "";
        const dateStr = new Date(event.event_date).toISOString().split("T")[0];

        const newDistances = oldDistStr
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d.length > 0)
          .map((d) => ({
            name: d,
            date: dateStr,
            start_time: "05:00", // Default start time
            cot: "",
          }));

        await client.query("UPDATE events SET distance = $1 WHERE id = $2", [
          JSON.stringify(newDistances),
          event.id,
        ]);
      }

      // Drop old column
      await client.query("ALTER TABLE events DROP COLUMN old_distance;");
      console.log("Distance migration completed.");
    } else {
      console.log("Distance column is already JSONB. Skipping migration.");
    }

    await client.query("COMMIT");
    console.log("Migration successfully finished.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
