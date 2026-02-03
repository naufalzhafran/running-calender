"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Calendar, LogOut, MapPin } from "lucide-react";
import { Event } from "@/types";

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchEvents();
      } else {
        alert("Failed to delete event");
      }
    } catch (err) {
      alert("An error occurred");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-md-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-md-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-background pb-20 relative">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-64 bg-md-surface-container -z-10 rounded-b-[48px]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-md-on-surface mb-2">
              Admin Dashboard
            </h1>
            <p className="text-md-on-surface-variant">
              Manage your events and runners.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center px-5 h-10 border border-md-outline/20 rounded-full text-sm font-medium text-md-on-surface hover:bg-md-surface-variant/30 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {events.length === 0 ? (
            <div className="px-6 py-24 text-center bg-md-surface rounded-[32px] border border-md-outline/10 shadow-sm">
              <p className="text-md-on-surface-variant text-lg">
                No events found. Tap the + button to create one.
              </p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-md-surface p-6 rounded-[24px] shadow-sm hover:shadow-md transition-shadow duration-300 border border-md-outline/5 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-md-secondary-container flex items-center justify-center shrink-0 text-md-on-secondary-container">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <Link
                      href={`/events/${event.id}`}
                      className="text-xl font-bold text-md-on-surface hover:text-md-primary transition-colors block mb-1 group-hover:underline decoration-2 decoration-transparent group-hover:decoration-md-primary/30 underline-offset-4"
                    >
                      {event.title}
                    </Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-md-on-surface-variant">
                      <span>
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> {event.location}
                      </span>
                      <span className="bg-md-surface-variant px-2 py-0.5 rounded-md text-xs font-semibold">
                        {event.distance}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="p-3 rounded-full text-md-primary hover:bg-md-primary/10 active:scale-95 transition-all"
                  >
                    <Edit className="h-5 w-5" />
                    <span className="sr-only">Edit</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-3 rounded-full text-md-error hover:bg-md-error/10 active:scale-95 transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <Link
        href="/admin/events/new"
        className="fixed bottom-8 right-8 w-14 h-14 bg-md-tertiary-container text-md-on-tertiary-container rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center transition-all duration-300 ease-emphasized z-50"
      >
        <Plus className="h-8 w-8" />
        <span className="sr-only">New Event</span>
      </Link>
    </div>
  );
}
