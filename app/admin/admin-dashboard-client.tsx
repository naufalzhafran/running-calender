"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, LogOut } from "lucide-react";

import { deleteEventAction, logoutAdminAction } from "@/app/admin/actions";
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
import { formatDateInJakarta } from "@/lib/date";
import { type Event } from "@/types";

type AdminDashboardClientProps = {
  events: Event[];
};

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

export function AdminDashboardClient({ events }: AdminDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { alertModal, showConfirm, showError } = useAlertModal();

  const confirmDelete = (id: string) => {
    showConfirm(
      "Apakah Anda yakin ingin menghapus event ini?",
      () => handleDelete(id),
      { title: "Hapus Event" },
    );
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteEventAction(id);

      if (result.ok) {
        router.refresh();
        return;
      }

      showError(result.message);
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdminAction();
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-md-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard Admin
            </h1>
            <p className="mt-1 text-muted-foreground">
              Kelola data event dan peserta.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              size="sm"
              disabled={isPending}
            >
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
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 py-20 text-center">
            <p className="mb-4 text-muted-foreground">
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
                      <div className="mt-1 text-xs text-muted-foreground md:hidden">
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
                          disabled={isPending}
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
