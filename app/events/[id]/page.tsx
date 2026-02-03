import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { Event, Participant } from "@/types";
import { Calendar, MapPin, Ruler, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {event.title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                <div>
                  <p className="font-medium text-gray-900">Date & Time</p>
                  <p>{new Date(event.event_date).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-indigo-500" />
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p>{event.location}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Ruler className="w-5 h-5 mr-2 text-indigo-500" />
                <div>
                  <p className="font-medium text-gray-900">Distance</p>
                  <p>{event.distance}</p>
                </div>
              </div>
            </div>

            {event.description && (
              <div className="prose max-w-none text-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  About the Event
                </h3>
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Participants
            </h2>
            <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
              {participants.length} Runners
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Bib Number
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      No participants registered yet.
                    </td>
                  </tr>
                ) : (
                  participants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        {participant.bib_number || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {participant.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
