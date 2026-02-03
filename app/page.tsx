import Link from "next/link";
import pool from "@/lib/db";
import { Event } from "@/types";
import { Calendar, MapPin, Ruler } from "lucide-react";

export const dynamic = "force-dynamic";

async function getEvents(): Promise<Event[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT * FROM events ORDER BY event_date ASC",
    );
    return res.rows;
  } finally {
    client.release();
  }
}

export default async function Home() {
  const events = await getEvents();

  return (
    <div className="min-h-screen relative overflow-hidden bg-md-background text-md-on-background pb-24">
      {/* Organic Background Shapes */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-md-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 left-0 -translate-x-1/3 w-[500px] h-[500px] bg-md-tertiary/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-display-small md:text-5xl font-bold text-md-on-background tracking-tight mb-2">
              Running Calendar
            </h1>
            <p className="text-md-on-surface-variant text-lg">
              Find your next race.
            </p>
          </div>
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center justify-center px-6 h-10 rounded-full bg-md-secondary-container text-md-on-secondary-container text-sm font-medium hover:brightness-95 transition-all duration-200 active:scale-95 ease-emphasized"
          >
            Admin Access
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-md-surface-container rounded-[32px] text-center border border-white/20">
            <div className="w-16 h-16 bg-md-surface-variant rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-md-on-surface-variant/50" />
            </div>
            <h3 className="text-xl font-medium text-md-on-surface mb-2">
              No events yet
            </h3>
            <p className="text-md-on-surface-variant">
              Check back later for upcoming races.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group relative block"
              >
                <div className="h-full bg-md-surface-container rounded-[24px] p-6 transition-all duration-300 ease-emphasized shadow-sm hover:shadow-md hover:bg-md-surface-container-high active:scale-[0.99] border border-transparent hover:border-md-outline/10 overflow-hidden isolate">
                  {/* Card State Layer */}
                  <div className="absolute inset-0 bg-md-primary/0 group-hover:bg-md-primary/5 transition-colors duration-300 -z-10" />

                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-md-primary-container text-md-on-primary-container">
                        {event.distance}
                      </span>
                      {new Date(event.event_date) < new Date() && (
                        <span className="text-xs font-medium text-md-outline">
                          Past
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold text-md-on-surface mb-3 group-hover:text-md-primary transition-colors">
                      {event.title}
                    </h2>

                    <div className="mt-auto space-y-3 text-md-on-surface-variant">
                      <div className="flex items-center group-hover:translate-x-1 transition-transform duration-300">
                        <Calendar className="w-5 h-5 mr-3 text-md-primary" />
                        <span className="text-sm font-medium">
                          {new Date(event.event_date).toLocaleDateString(
                            undefined,
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center group-hover:translate-x-1 transition-transform duration-300 delay-75">
                        <MapPin className="w-5 h-5 mr-3 text-md-secondary" />
                        <span className="text-sm">{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
