"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Calendar, LogOut } from "lucide-react";
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
    // In a real app we'd call an API to clear the cookie, but clearing locally or redirecting helps visually.
    // Since cookie is httpOnly, we can't clear it from JS.
    // We should probably have a logout endpoint, but simply redirecting to login is often enough if we rely on cookie expiration or just restricted access.
    // Proper way: call logout API.
    // For now, let's just force a refresh or similar, but simplified:
    document.cookie = "token=; Max-Age=0; path=/;"; // This won't work for HttpOnly.
    // So let's implement a logout route later or just redirect.
    // Given the constraints, I will create a simple logout action or just redirect to login which implies "done".
    // Actually, I'll rely on the user manually dealing with cookies if needed, or just redirect.
    // Better: Add a logout API route if I have time, but sticking to basics.
    // I will write a quick logout API in the next steps.
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex space-x-4">
            <Link
              href="/admin/events/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {events.length === 0 ? (
              <li className="px-6 py-12 text-center text-gray-500">
                No events found. Create one to get started.
              </li>
            ) : (
              events.map((event) => (
                <li key={event.id}>
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center truncate">
                      <div className="flex-shrink-0 mr-4">
                        <Calendar className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="truncate">
                        <Link
                          href={`/events/${event.id}`}
                          className="text-lg font-medium text-indigo-600 hover:text-indigo-900 truncate block"
                        >
                          {event.title}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {new Date(event.event_date).toLocaleDateString()} •{" "}
                          {event.location} • {event.distance}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="p-2 text-gray-400 hover:text-gray-500"
                      >
                        <Edit className="h-5 w-5" />
                        <span className="sr-only">Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-red-400 hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
