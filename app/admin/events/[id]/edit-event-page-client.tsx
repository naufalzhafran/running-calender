"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";

import { EventForm } from "@/components/admin/event-form";
import { useAlertModal } from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { eventToFormData, toEventRequestBody } from "@/lib/event-form";
import { type Event, type EventFormData } from "@/types";

type EditEventPageClientProps = {
  eventId: string;
};

async function fetchEvent(eventId: string) {
  const response = await fetch(`/api/events/${eventId}`);

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as Event;
}

export function EditEventPageClient({ eventId }: EditEventPageClientProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [initialFormData, setInitialFormData] =
    useState<EventFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { alertModal, showSuccess, showError } = useAlertModal();

  const loadEvent = useCallback(async () => {
    setIsLoading(true);

    try {
      const nextEvent = await fetchEvent(eventId);
      setEvent(nextEvent);
      setInitialFormData(nextEvent ? eventToFormData(nextEvent) : null);
    } catch {
      showError("Terjadi kesalahan saat mengambil data event");
    } finally {
      setIsLoading(false);
    }
  }, [eventId, showError]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  async function handleEventUpdate(formData: EventFormData) {
    if (!event) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toEventRequestBody(formData)),
      });

      if (response.ok) {
        showSuccess("Event berhasil diperbarui");
        await loadEvent();
        return;
      }

      showError("Gagal memperbarui event");
    } catch {
      showError("Terjadi kesalahan saat memperbarui event");
    }
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!event || !initialFormData) {
    return (
      <div className="p-8 text-center text-foreground">
        Event tidak ditemukan
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-md-background px-4 py-10">
      <div className="container mx-auto max-w-3xl">
        <Button
          variant="ghost"
          className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
          asChild
        >
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EventForm
              key={event.id}
              initialData={initialFormData}
              onSubmit={handleEventUpdate}
              submitLabel="Simpan Perubahan"
              loadingLabel="Menyimpan..."
              compact
            />
          </CardContent>
        </Card>
      </div>
      {alertModal}
    </div>
  );
}
