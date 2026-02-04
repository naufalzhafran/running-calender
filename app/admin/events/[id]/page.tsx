"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Save,
  Edit,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Event, Participant, DistanceDetail } from "@/types";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState<string>("");

  // Event Form State
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
        const formattedDate = date.toISOString().slice(0, 10);

        let formattedEndDate = "";
        if (data.end_date) {
          const endDate = new Date(data.end_date);
          formattedEndDate = endDate.toISOString().slice(0, 10);
        }

        const distancesArray: DistanceDetail[] = Array.isArray(data.distance)
          ? data.distance
          : [];

        // Ensure each distance date is also formatted correctly from API
        // if API returns ISO string with time
        const cleanDistances = distancesArray.map((d) => ({
          ...d,
          date: d.date
            ? new Date(d.date).toISOString().slice(0, 10)
            : formattedDate,
        }));

        setFormData({
          title: data.title,
          slug: data.slug,
          event_date: formattedDate,
          end_date: formattedEndDate,
          location: data.location,
          distances: cleanDistances,
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

  const handleDistanceDateSelect = (index: number, date: Date | undefined) => {
    if (!date) return;
    handleDistanceChange(index, "date", format(date, "yyyy-MM-dd"));
  };

  const handleEventUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          end_date: formData.end_date || null,
        }),
      });

      if (res.ok) {
        alert("Event berhasil diperbarui");
        fetchEventData(event.id);
      } else {
        alert("Gagal memperbarui event");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat memperbarui event");
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
        alert("Gagal menambahkan peserta");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menambahkan peserta");
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm("Hapus peserta ini?")) return;
    try {
      const res = await fetch(`/api/admin/participants/${participantId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchParticipants(eventId);
      }
    } catch (err) {
      alert("Gagal menghapus peserta");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  if (!event)
    return (
      <div className="p-8 text-center text-foreground">
        Event tidak ditemukan
      </div>
    );

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="container max-w-5xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Edit Event Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEventUpdate} className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label>Judul Event</Label>
                  <Input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Judul"
                    required
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
                        onSelect={(date) =>
                          handleDateSelect("event_date", date)
                        }
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
                  <Label>Lokasi</Label>
                  <Input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Lokasi"
                    required
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <Label>Kategori Jarak</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddDistance}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Tambah
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
                          <X className="w-3 h-3" />
                        </Button>

                        <div className="space-y-3 pt-1">
                          <div className="space-y-1">
                            <Label className="text-xs">Nama Kategori</Label>
                            <Input
                              type="text"
                              value={dist.name}
                              onChange={(e) =>
                                handleDistanceChange(
                                  idx,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="5K"
                              required
                              className="bg-background h-8 text-sm"
                            />
                          </div>

                          <div className="space-y-1 flex flex-col">
                            <Label className="text-xs">Tanggal</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal h-8 text-sm",
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
                                  <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
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

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Start Time</Label>
                              <TimePicker
                                value={dist.start_time}
                                onChange={(val) =>
                                  handleDistanceChange(idx, "start_time", val)
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">COT</Label>
                              <TimePicker
                                value={dist.cot}
                                onChange={(val) =>
                                  handleDistanceChange(idx, "cot", val)
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.distances.length === 0 && (
                      <div className="text-center p-4 border border-dashed rounded-lg text-xs text-muted-foreground">
                        Belum ada kategori jarak
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Participants Management */}
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-2">
                <CardTitle>Peserta</CardTitle>
                <Badge variant="secondary" className="rounded-full">
                  {participants.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6">
              {/* Add Participant Form */}
              <div className="bg-muted/30 p-4 rounded-lg border">
                <h3 className="text-sm font-medium mb-3">Tambah Peserta</h3>
                <form
                  onSubmit={handleAddParticipant}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Nama"
                      value={newParticipant.name}
                      onChange={(e) =>
                        setNewParticipant({
                          ...newParticipant,
                          name: e.target.value,
                        })
                      }
                      className="bg-background"
                      required
                    />
                  </div>
                  <div className="w-full sm:w-24">
                    <Input
                      type="text"
                      placeholder="Bib"
                      value={newParticipant.bib_number}
                      onChange={(e) =>
                        setNewParticipant({
                          ...newParticipant,
                          bib_number: e.target.value,
                        })
                      }
                      className="bg-background"
                    />
                  </div>
                  <Button type="submit" size="icon" className="shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </form>
              </div>

              {/* Participants List */}
              <div className="flex-1 overflow-auto border rounded-md max-h-[500px]">
                {participants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <p className="text-sm">Belum ada peserta.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Bib</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono font-medium">
                            {p.bib_number || "-"}
                          </TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteParticipant(p.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
