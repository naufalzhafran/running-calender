import { buildEventCalendar } from "@/lib/calendar";
import { getEventById } from "@/lib/data";
import { createSlug } from "@/lib/event-utils";

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
