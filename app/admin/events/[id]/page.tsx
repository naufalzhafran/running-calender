"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Save, Edit } from "lucide-react";
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
      const resEvent = await fetch(`/api/events/${id}`);
      if (resEvent.ok) {
        const data = await resEvent.json();
        setEvent(data);
        const date = new Date(data.event_date);
        const formattedDate = date.toISOString().slice(0, 16);

        setFormData({
          title: data.title,
          slug: data.slug,
          event_date: formattedDate,
          location: data.location,
          distance: data.distance,
          description: data.description || "",
        });
      }
      fetchParticipants(id);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (id: string) => {
    const res = await fetch(`/api/events/${id}/participants`);
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

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-md-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-md-primary border-t-transparent" />
      </div>
    );

  if (!event)
    return (
      <div className="p-8 text-center text-md-on-background">
        Event not found
      </div>
    );

  return (
    <div className="min-h-screen bg-md-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm font-medium text-md-secondary hover:text-md-on-background mb-8 px-4 py-2 rounded-full hover:bg-md-on-surface/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Edit Event Form */}
          <div className="bg-md-surface-container p-6 rounded-[32px] shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-md-outline/10 pb-4">
              <div className="w-10 h-10 rounded-full bg-md-secondary-container flex items-center justify-center text-md-on-secondary-container">
                <Edit className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-md-on-surface">
                Edit Event
              </h2>
            </div>

            <form onSubmit={handleEventUpdate} className="space-y-4">
              {/* Title */}
              <div className="space-y-2 group">
                <label className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors">
                  Event Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full h-12 px-4 rounded-2xl bg-md-surface-container-highest/30 border border-md-outline/10 text-md-on-surface placeholder:text-md-on-surface-variant/30 text-base focus:bg-md-surface focus:border-md-primary/30 focus:ring-4 focus:ring-md-primary/5 focus:shadow-md outline-none transition-all duration-300 ease-emphasized"
                  placeholder="Title"
                  required
                />
              </div>

              {/* Date */}
              <div className="space-y-2 group">
                <label className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors">
                  Date
                </label>
                <input
                  type="datetime-local"
                  name="event_date"
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData({ ...formData, event_date: e.target.value })
                  }
                  className="w-full h-12 px-4 rounded-2xl bg-md-surface-container-highest/30 border border-md-outline/10 text-md-on-surface text-base focus:bg-md-surface focus:border-md-primary/30 focus:ring-4 focus:ring-md-primary/5 focus:shadow-md outline-none transition-all duration-300 ease-emphasized"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Location */}
                <div className="space-y-2 group">
                  <label className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full h-12 px-4 rounded-2xl bg-md-surface-container-highest/30 border border-md-outline/10 text-md-on-surface placeholder:text-md-on-surface-variant/30 text-base focus:bg-md-surface focus:border-md-primary/30 focus:ring-4 focus:ring-md-primary/5 focus:shadow-md outline-none transition-all duration-300 ease-emphasized"
                    placeholder="Location"
                    required
                  />
                </div>

                {/* Distance */}
                <div className="space-y-2 group">
                  <label className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors">
                    Distance
                  </label>
                  <div className="relative">
                    <select
                      name="distance"
                      value={formData.distance}
                      onChange={(e) =>
                        setFormData({ ...formData, distance: e.target.value })
                      }
                      className="w-full h-12 px-4 rounded-2xl bg-md-surface-container-highest/30 border border-md-outline/10 text-md-on-surface text-base appearance-none cursor-pointer focus:bg-md-surface focus:border-md-primary/30 focus:ring-4 focus:ring-md-primary/5 focus:shadow-md outline-none transition-all duration-300 ease-emphasized"
                      required
                    >
                      <option value="5K">5K</option>
                      <option value="10K">10K</option>
                      <option value="Half Marathon">Half Marathon</option>
                      <option value="Full Marathon">Full Marathon</option>
                      <option value="Ultra Marathon">Ultra Marathon</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-md-on-surface-variant">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 group">
                <label className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full p-4 rounded-2xl bg-md-surface-container-highest/30 border border-md-outline/10 text-md-on-surface placeholder:text-md-on-surface-variant/30 text-base resize-none focus:bg-md-surface focus:border-md-primary/30 focus:ring-4 focus:ring-md-primary/5 focus:shadow-md outline-none transition-all duration-300 ease-emphasized"
                />
              </div>

              <button
                type="submit"
                className="w-full h-14 rounded-full bg-md-primary text-md-on-primary font-medium text-lg shadow-lg shadow-md-primary/25 hover:shadow-xl hover:bg-md-primary/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-4"
              >
                <Save className="w-5 h-5" />
                Update Event
              </button>
            </form>
          </div>

          {/* Participants Management */}
          <div className="bg-md-surface-container p-6 rounded-[32px] shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 border-b border-md-outline/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-md-tertiary-container flex items-center justify-center text-md-on-tertiary-container">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-md-on-surface">
                  Participants
                </h2>
              </div>
              <span className="bg-md-surface-variant text-md-on-surface-variant px-3 py-1 rounded-full text-xs font-bold">
                {participants.length}
              </span>
            </div>

            {/* Add Participant Form */}
            <form
              onSubmit={handleAddParticipant}
              className="mb-6 bg-md-surface-container-high p-4 rounded-[20px]"
            >
              <h3 className="text-sm font-semibold text-md-on-surface mb-3 ml-1">
                Add Runner
              </h3>
              <div className="flex gap-3">
                <div className="flex-1">
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
                    className="w-full h-12 px-4 rounded-xl bg-md-surface-container-highest/30 border border-md-outline/10 text-md-on-surface text-sm focus:bg-md-surface focus:border-md-primary/30 focus:shadow-md outline-none transition-all"
                    required
                  />
                </div>
                <div className="w-24">
                  <input
                    type="text"
                    placeholder="Bib"
                    value={newParticipant.bib_number}
                    onChange={(e) =>
                      setNewParticipant({
                        ...newParticipant,
                        bib_number: e.target.value,
                      })
                    }
                    className="w-full h-12 px-4 rounded-xl bg-md-surface-container-highest/30 border border-md-outline/10 text-md-on-surface text-sm focus:bg-md-surface focus:border-md-primary/30 focus:shadow-md outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 w-12 rounded-full bg-md-primary text-md-on-primary flex items-center justify-center shadow-lg shadow-md-primary/20 hover:bg-md-primary/90 active:scale-95 transition-all"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </form>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin scrollbar-thumb-md-outline/20">
              {participants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-md-on-surface-variant/50">
                  <p className="text-sm">No participants yet.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {participants.map((p) => (
                    <li
                      key={p.id}
                      className="p-3 bg-md-surface rounded-[16px] border border-md-outline/5 flex justify-between items-center group hover:border-md-outline/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-md-secondary-container text-md-on-secondary-container flex items-center justify-center text-xs font-bold font-mono">
                          {p.bib_number || "#"}
                        </div>
                        <p className="text-sm font-medium text-md-on-surface">
                          {p.name}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteParticipant(p.id)}
                        className="w-8 h-8 rounded-full text-md-on-surface-variant hover:bg-md-error-container hover:text-md-on-error-container flex items-center justify-center transition-colors"
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
