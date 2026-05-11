"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";

import { updateEventAction } from "@/app/admin/actions";
import { EventForm } from "@/components/admin/event-form";
import { useAlertModal } from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventToFormData, toEventRequestBody } from "@/lib/event-form";
import { type Event, type EventFormData } from "@/types";

type EditEventPageClientProps = {
  event: Event;
};

export function EditEventPageClient({ event }: EditEventPageClientProps) {
  const router = useRouter();
  const [currentEvent, setCurrentEvent] = useState(event);
  const [initialFormData, setInitialFormData] = useState<EventFormData>(
    eventToFormData(event),
  );
  const { alertModal, showSuccess, showError } = useAlertModal();

  async function handleEventUpdate(formData: EventFormData) {
    try {
      const result = await updateEventAction(
        currentEvent.id,
        toEventRequestBody(formData),
      );

      if (result.ok) {
        setCurrentEvent(result.event);
        setInitialFormData(eventToFormData(result.event));
        showSuccess("Event berhasil diperbarui");
        router.refresh();
        return;
      }

      showError(result.message);
    } catch {
      showError("Terjadi kesalahan saat memperbarui event");
    }
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
              key={`${currentEvent.id}-${initialFormData.slug}`}
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
