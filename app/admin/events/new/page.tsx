"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { DistanceDetail } from "@/types";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    event_date: string;
    end_date: string;
    location: string;
    distances: DistanceDetail[];
    description: string;
  }>({
    title: "",
    slug: "",
    event_date: "",
    end_date: "",
    location: "",
    distances: [],
    description: "",
  });

  // Removed availableDistances as we now support dynamic distance input

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

  const handleAddDistance = () => {
    setFormData((prev) => ({
      ...prev,
      distances: [
        ...prev.distances,
        {
          name: "",
          date: prev.event_date.split("T")[0] || "",
          start_time: "",
          cot: "",
        },
      ],
    }));
  };

  const handleRemoveDistance = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      distances: prev.distances.filter((_, i) => i !== index),
    }));
  };

  const handleDistanceChange = (
    index: number,
    field: keyof DistanceDetail,
    value: string,
  ) => {
    setFormData((prev) => {
      const newDistances = [...prev.distances];
      newDistances[index] = { ...newDistances[index], [field]: value };
      return { ...prev, distances: newDistances };
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
        // Send data directly (distance is now JSON)
        body: JSON.stringify({
          ...formData,
          end_date: formData.end_date || null,
        }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.message || "Gagal membuat event");
      }
    } catch (err) {
      setError("Terjadi kesalahan");
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
          Kembali ke Dashboard
        </Link>

        <div className="bg-md-surface-container p-8 rounded-[32px] shadow-sm">
          <h1 className="text-3xl font-bold text-md-on-surface mb-8">
            Buat Event Baru
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
                Judul Event
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
                  placeholder="Contoh: Jakarta Marathon 2026"
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2 group">
              <label
                htmlFor="event_date"
                className="text-sm font-semibold text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors"
              >
                Tanggal
              </label>
              <div className="relative">
                <input
                  type="date"
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

            {/* End Date */}
            <div className="space-y-2 group">
              <label
                htmlFor="end_date"
                className="text-sm font-semibold text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors"
              >
                Tanggal Selesai (Opsional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="end_date"
                  id="end_date"
                  value={formData.end_date}
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
                  Lokasi
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
                    placeholder="Contoh: GBK, Jakarta"
                  />
                </div>
              </div>

              <div className="space-y-3 group">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-md-on-surface-variant flex items-center gap-2 ml-1">
                    Jarak
                  </label>
                  <button
                    type="button"
                    onClick={handleAddDistance}
                    className="text-xs bg-md-primary-container text-md-on-primary-container px-3 py-1 rounded-full hover:brightness-95 transition-all"
                  >
                    + Tambah
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {formData.distances.map((dist, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-md-surface-container-highest/30 border border-md-outline/10 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveDistance(idx)}
                        className="absolute top-2 right-2 text-md-on-surface-variant/50 hover:text-md-error transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-md-on-surface-variant/70 mb-1 block">
                            Nama
                          </label>
                          <input
                            type="text"
                            value={dist.name}
                            onChange={(e) =>
                              handleDistanceChange(idx, "name", e.target.value)
                            }
                            className="w-full h-10 px-3 rounded-xl bg-md-surface border border-md-outline/10 text-sm focus:border-md-primary/50 outline-none"
                            placeholder="5K"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-md-on-surface-variant/70 mb-1 block">
                              Start
                            </label>
                            <input
                              type="time"
                              value={dist.start_time}
                              onChange={(e) =>
                                handleDistanceChange(
                                  idx,
                                  "start_time",
                                  e.target.value,
                                )
                              }
                              className="w-full h-10 px-3 rounded-xl bg-md-surface border border-md-outline/10 text-sm focus:border-md-primary/50 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-md-on-surface-variant/70 mb-1 block">
                              COT
                            </label>
                            <input
                              type="time"
                              value={dist.cot}
                              onChange={(e) =>
                                handleDistanceChange(idx, "cot", e.target.value)
                              }
                              className="w-full h-10 px-3 rounded-xl bg-md-surface border border-md-outline/10 text-sm focus:border-md-primary/50 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {formData.distances.length === 0 && (
                    <div className="text-center p-4 border border-dashed border-md-outline/20 rounded-2xl text-sm text-md-on-surface-variant">
                      Belum ada kategori jarak
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 group">
              <label
                htmlFor="description"
                className="text-sm font-semibold text-md-on-surface-variant flex items-center gap-2 ml-1 group-focus-within:text-md-primary transition-colors"
              >
                Deskripsi
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
                  placeholder="Ceritakan tentang lomba ini..."
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center items-center px-8 h-12 border border-transparent text-sm font-medium rounded-full text-md-on-primary bg-md-primary hover:bg-md-primary/90 shadow-lg hover:shadow-xl shadow-md-primary/20 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Membuat..." : "Buat Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
