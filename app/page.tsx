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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Running Event Calendar
          </h1>
          <Link
            href="/admin"
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Admin Login
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No upcoming events found.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block group"
              >
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100 h-full flex flex-col">
                  <div className="p-6 flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {event.title}
                    </h2>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
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
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Ruler className="w-4 h-4 mr-2" />
                        <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          {event.distance}
                        </span>
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
