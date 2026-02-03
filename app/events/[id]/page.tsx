import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { Event, Participant } from "@/types";
import { Calendar, MapPin, Ruler, ArrowLeft, Users } from "lucide-react";

export const dynamic = "force-dynamic";

async function getEvent(id: string): Promise<Event | null> {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM events WHERE id = $1", [id]);
    return res.rows[0] || null;
  } catch (err) {
    return null;
  } finally {
    client.release();
  }
}

async function getParticipants(eventId: string): Promise<Participant[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT * FROM participants WHERE event_id = $1 ORDER BY name ASC",
      [eventId],
    );
    return res.rows;
  } finally {
    client.release();
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const participants = await getParticipants(id);

  return (
    <div className="min-h-screen bg-md-background text-md-on-background pb-20 relative overflow-x-hidden">
      {/* Ambient Backdrops */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-md-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-md-secondary hover:text-md-on-surface mb-8 px-4 py-2 rounded-full hover:bg-md-secondary/5 transition-colors active:scale-95 ease-emphasized"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Link>

        {/* Hero Card */}
        <div className="bg-md-surface-container rounded-[32px] sm:rounded-[40px] p-8 sm:p-12 mb-8 shadow-sm relative overflow-hidden">
          {/* Decorative shape inside card */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-md-primary/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-md-tertiary-container text-md-on-tertiary-container text-sm font-bold mb-6">
              {event.distance}
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-md-on-surface mb-6 tracking-tight">
              {event.title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 text-md-on-surface-variant mb-8">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-md-surface-container-high flex items-center justify-center mr-4 text-md-primary">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Date
                  </p>
                  <p className="text-lg font-medium text-md-on-surface">
                    {new Date(event.event_date).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-md-surface-container-high flex items-center justify-center mr-4 text-md-secondary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Location
                  </p>
                  <p className="text-lg font-medium text-md-on-surface">
                    {event.location}
                  </p>
                </div>
              </div>
            </div>

            {event.description && (
              <div className="prose prose-lg text-md-on-surface-variant max-w-none border-t border-md-outline/10 pt-6">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Participants Section */}
        <div className="bg-md-surface-container-low rounded-[32px] overflow-hidden border border-md-outline/5">
          <div className="px-8 py-6 bg-md-surface-container flex justify-between items-center border-b border-md-outline/5">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-md-primary/10 flex items-center justify-center mr-3 text-md-primary">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-md-on-surface">Roster</h2>
            </div>
            <span className="bg-md-secondary-container text-md-on-secondary-container px-4 py-1 rounded-full text-sm font-bold">
              {participants.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-md-surface-container/50 text-md-on-surface-variant text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-8 py-4">Bib</th>
                  <th className="px-8 py-4">Name</th>
                  <th className="px-8 py-4">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-md-outline/5 text-md-on-surface text-sm">
                {participants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-8 py-12 text-center text-md-on-surface-variant"
                    >
                      No participants registered yet.
                    </td>
                  </tr>
                ) : (
                  participants.map((participant) => (
                    <tr
                      key={participant.id}
                      className="hover:bg-md-surface-container-high/50 transition-colors"
                    >
                      <td className="px-8 py-4 font-mono text-md-primary font-bold">
                        {participant.bib_number || "—"}
                      </td>
                      <td className="px-8 py-4 font-medium">
                        {participant.name}
                      </td>
                      <td className="px-8 py-4 text-md-on-surface-variant">
                        {event.distance}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
