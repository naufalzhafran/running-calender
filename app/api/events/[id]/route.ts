import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getEventById } from "@/lib/data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
