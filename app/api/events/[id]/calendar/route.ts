import { getEventById } from "@/lib/data";
import { buildEventCalendar } from "@/lib/calendar";

export const dynamic = "force-dynamic";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/events/[id]/calendar">,
) {
  const { id } = await ctx.params;
  const event = await getEventById(id);

  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  const url = new URL(request.url);
  const distance = url.searchParams.get("distance");
  const calendar = buildEventCalendar(event, distance);
  const filename = `${createSlug(event.title || "kalender-lari")}.ics`;

  return new Response(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=0, s-maxage=300",
    },
  });
}
