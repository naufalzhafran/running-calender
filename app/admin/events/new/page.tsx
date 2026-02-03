"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    event_date: string;
    location: string;
    distances: string[]; // Changed from distance string to array
    description: string;
  }>({
    title: "",
    slug: "",
    event_date: "",
    location: "",
    distances: [],
    description: "",
  });

  const availableDistances = [
    "5K",
    "10K",
    "Half Marathon",
    "Full Marathon",
    "Ultra Marathon",
  ];

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "title") {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  const handleDistanceChange = (distance: string) => {
    setFormData((prev) => {
      const currentDistances = prev.distances;
      if (currentDistances.includes(distance)) {
        return {
          ...prev,
          distances: currentDistances.filter((d) => d !== distance),
        };
      } else {
        return { ...prev, distances: [...currentDistances, distance] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Join distances into a string for the API/DB
        body: JSON.stringify({
          ...formData,
          distance: formData.distances.join(", "),
        }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to create event");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-md-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm font-medium text-md-secondary hover:text-md-on-background mb-8 px-4 py-2 rounded-full hover:bg-md-on-surface/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-md-surface-container p-8 rounded-[32px] shadow-sm">
          <h1 className="text-3xl font-bold text-md-on-surface mb-8">
            Create New Event
          </h1>

          {error && (
            <div className="mb-6 bg-md-error/10 border-l-4 border-md-error p-4 text-sm text-md-error font-medium rounded-r-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2 group">
              <label
                htmlFor="title"
                className="text-sm font-semibold text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors"
              >
                Event Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full h-14 px-5 rounded-[20px] bg-md-surface-container-highest/30 border border-md-outline/10 
                           text-md-on-surface placeholder:text-md-on-surface-variant/30 text-base
                           focus:bg-md-surface focus:border-md-primary/30 focus:ring-4 focus:ring-md-primary/5 focus:shadow-lg focus:shadow-md-primary/5 
                           outline-none transition-all duration-300 ease-emphasized"
                  placeholder="e.g. Summer City Marathon"
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2 group">
              <label
                htmlFor="event_date"
                className="text-sm font-semibold text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors"
              >
                Date & Time
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="event_date"
                  id="event_date"
                  required
                  value={formData.event_date}
                  onChange={handleChange}
                  className="w-full h-14 px-5 rounded-[20px] bg-md-surface-container-highest/30 border border-md-outline/10 
                           text-md-on-surface text-base
                           focus:bg-md-surface focus:border-md-primary/30 focus:ring-4 focus:ring-md-primary/5 focus:shadow-lg focus:shadow-md-primary/5 
                           outline-none transition-all duration-300 ease-emphasized"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location */}
              <div className="space-y-2 group">
                <label
                  htmlFor="location"
                  className="text-sm font-semibold text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors"
                >
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="location"
                    id="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full h-14 px-5 rounded-[20px] bg-md-surface-container-highest/30 border border-md-outline/10 
                             text-md-on-surface placeholder:text-md-on-surface-variant/30 text-base
                             focus:bg-md-surface focus:border-md-primary/30 focus:ring-4 focus:ring-md-primary/5 focus:shadow-lg focus:shadow-md-primary/5 
                             outline-none transition-all duration-300 ease-emphasized"
                    placeholder="e.g. Central Park, NY"
                  />
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-sm font-semibold text-md-on-surface-variant flex items-center gap-2 ml-1">
                  Distances
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availableDistances.map((dist) => (
                    <label
                      key={dist}
                      className={`
                      relative flex items-center justify-center h-12 px-4 rounded-[20px] 
                      border cursor-pointer transition-all duration-200 ease-emphasized select-none
                      ${
                        formData.distances.includes(dist)
                          ? "bg-md-primary-container text-md-on-primary-container border-md-primary font-medium shadow-sm"
                          : "bg-md-surface-container-highest/30 border-md-outline/10 text-md-on-surface-variant hover:bg-md-surface-container-highest/50"
                      }
                    `}
                    >
                      <input
                        type="checkbox"
                        value={dist}
                        checked={formData.distances.includes(dist)}
                        onChange={() => handleDistanceChange(dist)}
                        className="sr-only"
                      />
                      <span className="text-sm">{dist}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 group">
              <label
                htmlFor="description"
                className="text-sm font-semibold text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors"
              >
                Description
              </label>
              <div className="relative">
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-5 rounded-[24px] bg-md-surface-container-highest/30 border border-md-outline/10 
                           text-md-on-surface placeholder:text-md-on-surface-variant/30 text-base resize-none
                           focus:bg-md-surface focus:border-md-primary/30 focus:ring-4 focus:ring-md-primary/5 focus:shadow-lg focus:shadow-md-primary/5 
                           outline-none transition-all duration-300 ease-emphasized"
                  placeholder="Tell people about the race..."
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center items-center px-8 h-12 border border-transparent text-sm font-medium rounded-full text-md-on-primary bg-md-primary hover:bg-md-primary/90 shadow-lg hover:shadow-xl shadow-md-primary/20 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
