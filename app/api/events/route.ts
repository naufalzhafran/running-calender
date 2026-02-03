import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT * FROM events ORDER BY event_date ASC",
    );
    return NextResponse.json(res.rows);
  } catch (err) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
