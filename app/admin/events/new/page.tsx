"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, Plus, Calendar as CalendarIcon } from "lucide-react";
import { DistanceDetail } from "@/types";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";

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

  const handleDateSelect = (
    field: "event_date" | "end_date",
    date: Date | undefined,
  ) => {
    if (!date) return;
    setFormData((prev) => ({
      ...prev,
      [field]: format(date, "yyyy-MM-dd"),
    }));
  };

  const handleAddDistance = () => {
    setFormData((prev) => ({
      ...prev,
      distances: [
        ...prev.distances,
        {
          name: "",
          date: prev.event_date || "",
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

  const handleDistanceDateSelect = (index: number, date: Date | undefined) => {
    if (!date) return;
    handleDistanceChange(index, "date", format(date, "yyyy-MM-dd"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          event_date: formData.event_date,
          end_date: formData.end_date || null,
          location: formData.location,
          distance: JSON.stringify(formData.distances), // API expects 'distance' as JSON string/object
          description: formData.description,
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
    <div className="min-h-screen bg-md-background py-10 px-4">
      <div className="container max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
          asChild
        >
          <Link href="/admin">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Buat Event Baru</CardTitle>
            <CardDescription>
              Isi detail di bawah untuk membuat event lari baru.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 bg-destructive/15 text-destructive font-medium p-4 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Judul Event</Label>
                <Input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Contoh: Jakarta Marathon 2026"
                />
              </div>

              {/* Date */}
              <div className="space-y-2 flex flex-col">
                <Label>Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formData.event_date && "text-muted-foreground",
                      )}
                    >
                      {formData.event_date ? (
                        format(new Date(formData.event_date), "PPP", {
                          locale: idLocale,
                        })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        formData.event_date
                          ? new Date(formData.event_date)
                          : undefined
                      }
                      onSelect={(date) => handleDateSelect("event_date", date)}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2 flex flex-col">
                <Label>Tanggal Selesai (Opsional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formData.end_date && "text-muted-foreground",
                      )}
                    >
                      {formData.end_date ? (
                        format(new Date(formData.end_date), "PPP", {
                          locale: idLocale,
                        })
                      ) : (
                        <span>Pilih tanggal selesai</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        formData.end_date
                          ? new Date(formData.end_date)
                          : undefined
                      }
                      onSelect={(date) => handleDateSelect("end_date", date)}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  type="text"
                  name="location"
                  id="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Contoh: GBK, Jakarta"
                />
              </div>

              {/* Distances */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Kategori Jarak</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDistance}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.distances.map((dist, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border bg-muted/30 relative"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveDistance(idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Nama Kategori</Label>
                          <Input
                            type="text"
                            value={dist.name}
                            onChange={(e) =>
                              handleDistanceChange(idx, "name", e.target.value)
                            }
                            placeholder="5K"
                            required
                            className="bg-background"
                          />
                        </div>

                        <div className="space-y-2 flex flex-col">
                          <Label className="text-xs">Tanggal</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal h-9",
                                  !dist.date && "text-muted-foreground",
                                )}
                              >
                                {dist.date ? (
                                  format(new Date(dist.date), "PPP", {
                                    locale: idLocale,
                                  })
                                ) : (
                                  <span>Pilih tanggal</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  dist.date ? new Date(dist.date) : undefined
                                }
                                onSelect={(date) =>
                                  handleDistanceDateSelect(idx, date)
                                }
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Start Time</Label>
                            <TimePicker
                              value={dist.start_time}
                              onChange={(val) =>
                                handleDistanceChange(idx, "start_time", val)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">COT</Label>
                            <TimePicker
                              value={dist.cot}
                              onChange={(val) =>
                                handleDistanceChange(idx, "cot", val)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {formData.distances.length === 0 && (
                    <div className="text-center p-6 border border-dashed rounded-lg text-sm text-muted-foreground">
                      Belum ada kategori jarak ditambahkan
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  name="description"
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ceritakan tentang lomba ini..."
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Membuat..." : "Buat Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
