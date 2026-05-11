"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAlertModal } from "@/components/ui/alert-modal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDateInJakarta } from "@/lib/date";
import { type Event } from "@/types";

async function fetchEvents() {
  const response = await fetch("/api/events");

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  return (await response.json()) as Event[];
}

function DistanceBadges({ event }: { event: Event }) {
  return (
    <div className="flex flex-wrap gap-1">
      {event.distance.map((distance, index) => (
        <Badge
          key={`${distance.name}-${index}`}
          variant="secondary"
          className="text-xs font-normal"
        >
          {distance.name}
        </Badge>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { alertModal, showConfirm, showError } = useAlertModal();

  const loadEvents = useCallback(async () => {
    try {
      setEvents(await fetchEvents());
    } catch {
      showError("Gagal mengambil daftar event");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const confirmDelete = (id: string) => {
    showConfirm(
      "Apakah Anda yakin ingin menghapus event ini?",
      () => handleDelete(id),
      { title: "Hapus Event" },
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadEvents();
      } else {
        showError("Gagal menghapus event");
      }
    } catch {
      showError("Terjadi kesalahan");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-md-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard Admin
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola data event dan peserta.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/events/new">
                <Plus className="mr-2 h-4 w-4" />
                Event Baru
              </Link>
            </Button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-lg text-center">
            <p className="text-muted-foreground mb-4">
              Belum ada event yang dibuat.
            </p>
            <Button asChild>
              <Link href="/admin/events/new">
                <Plus className="mr-2 h-4 w-4" />
                Buat Event Pertama
              </Link>
            </Button>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Event</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Tanggal
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Lokasi</TableHead>
                  <TableHead>Jarak</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/events/${event.id}`}
                        className="hover:underline"
                      >
                        {event.title}
                      </Link>
                      <div className="md:hidden text-xs text-muted-foreground mt-1">
                        {formatDateInJakarta(event.event_date, {
                          day: "numeric",
                          month: "numeric",
                          year: "numeric",
                        })}{" "}
                        • {event.location}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDateInJakarta(event.event_date, {
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {event.location}
                    </TableCell>
                    <TableCell>
                      <DistanceBadges event={event} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                        >
                          <Link href={`/admin/events/${event.id}`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(event.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
      {alertModal}
    </div>
  );
}
