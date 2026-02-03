"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { Event, Participant } from "@/types";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventId, setEventId] = useState<string>("");

  // Event Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    event_date: "",
    location: "",
    distance: "",
    description: "",
  });

  // Participant Form State
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    bib_number: "",
  });

  useEffect(() => {
    params.then((p) => {
      setEventId(p.id);
      fetchEventData(p.id);
    });
  }, [params]);

  const fetchEventData = async (id: string) => {
    try {
      // Fetch Event
      const resEvent = await fetch(`/api/events/${id}`);
      if (resEvent.ok) {
        const data = await resEvent.json();
        setEvent(data);
        // Format date for datetime-local input
        const date = new Date(data.event_date);
        const formattedDate = date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

        setFormData({
          title: data.title,
          slug: data.slug,
          event_date: formattedDate,
          location: data.location,
          distance: data.distance,
          description: data.description || "",
        });
      }

      // Fetch Participants - we need an API for this or reuse GET /api/events/[id] public page logic?
      // Oops, the public page logic fetches participants via DB query.
      // We need an API or we can just add a `participants` include to the event API?
      // The PRD says "Participant Management ... Located within the Edit Event view".
      // I don't have a specific API to list participants for an event in the Admin API list yet,
      // BUT I can create one or just misuse the public page logic if I was doing server components.
      // Since I am in a Client Component, I need an API.
      // I'll create a quick GET endpoint for participants or just update the logic to use what I have.
      // Actually, I can add a `GET /api/admin/participants?event_id=XYZ` or similar.
      // Or I can just blindly create it now.
      // Let's create GET /api/admin/participants?event_id=...

      // WAIT, I haven't created a GET participants API. I'll rely on a new fetch or just add it now.
      // For simplicity, I'll add the fetch logic here assuming I'll fix the API in a moment.
      // Or I can use a server action if this was server component.

      // Let's Assume I create GET /api/events/[id]/participants
      fetchParticipants(id);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (id: string) => {
    const res = await fetch(`/api/events/${id}/participants`); // Need to create this
    if (res.ok) {
      setParticipants(await res.json());
    }
  };

  const handleEventUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Event updated successfully");
        fetchEventData(event.id);
      } else {
        alert("Failed to update event");
      }
    } catch (err) {
      alert("Error updating event");
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      const res = await fetch("/api/admin/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          ...newParticipant,
        }),
      });

      if (res.ok) {
        setNewParticipant({ name: "", bib_number: "" });
        fetchParticipants(event.id);
      } else {
        alert("Failed to add participant");
      }
    } catch (err) {
      alert("Error adding participant");
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm("Delete this participant?")) return;
    try {
      const res = await fetch(`/api/admin/participants/${participantId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchParticipants(eventId);
      }
    } catch (err) {
      alert("Error deleting participant");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!event) return <div className="p-8">Event not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin"
          className="text-gray-500 hover:text-gray-900 flex items-center mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Edit Event Form */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Edit Event</h2>
            <form onSubmit={handleEventUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="datetime-local"
                  name="event_date"
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData({ ...formData, event_date: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Distance
                  </label>
                  <select
                    name="distance"
                    value={formData.distance}
                    onChange={(e) =>
                      setFormData({ ...formData, distance: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    <option value="5K">5K</option>
                    <option value="10K">10K</option>
                    <option value="Half Marathon">Half Marathon</option>
                    <option value="Full Marathon">Full Marathon</option>
                    <option value="Ultra Marathon">Ultra Marathon</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
              >
                Update Event
              </button>
            </form>
          </div>

          {/* Participants Management */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Participants</h2>

            {/* Add Participant Form */}
            <form
              onSubmit={handleAddParticipant}
              className="mb-6 bg-gray-50 p-4 rounded-md"
            >
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Add New Participant
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newParticipant.name}
                  onChange={(e) =>
                    setNewParticipant({
                      ...newParticipant,
                      name: e.target.value,
                    })
                  }
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Bib Number"
                    value={newParticipant.bib_number}
                    onChange={(e) =>
                      setNewParticipant({
                        ...newParticipant,
                        bib_number: e.target.value,
                      })
                    }
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

            {/* Participants List */}
            <div className="overflow-y-auto max-h-[500px]">
              {participants.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">
                  No participants yet.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {participants.map((p) => (
                    <li
                      key={p.id}
                      className="py-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Bib: {p.bib_number || "-"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteParticipant(p.id)}
                        className="text-red-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
