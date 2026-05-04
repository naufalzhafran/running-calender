"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { Event, DistanceDetail } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm, EventFormData } from "@/components/admin/event-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAlertModal } from "@/components/ui/alert-modal";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialFormData, setInitialFormData] = useState<EventFormData | null>(
    null,
  );
  const { alertModal, showSuccess, showError } = useAlertModal();

  const fetchEventData = async (id: string) => {
    try {
      const resEvent = await fetch(`/api/events/${id}`);
      if (resEvent.ok) {
        const data = await resEvent.json();
        setEvent(data);
        const formattedDate = new Date(data.event_date)
          .toISOString()
          .slice(0, 10);

        let formattedEndDate = "";
        if (data.end_date) {
          formattedEndDate = new Date(data.end_date)
            .toISOString()
            .slice(0, 10);
        }

        const distancesArray: DistanceDetail[] = Array.isArray(data.distance)
          ? data.distance
          : [];

        const cleanDistances = distancesArray.map((d) => ({
          ...d,
          date: d.date
            ? new Date(d.date).toISOString().slice(0, 10)
            : formattedDate,
        }));

        setInitialFormData({
          title: data.title,
          slug: data.slug,
          event_date: formattedDate,
          end_date: formattedEndDate,
          location: data.location,
          distances: cleanDistances,
          description: data.description || "",
        });
      }
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      const { id } = await params;
      await fetchEventData(id);
    };

    void initializePage();
  }, [params]);

  const handleEventUpdate = async (formData: EventFormData) => {
    if (!event) return;

    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          event_date: formData.event_date,
          end_date: formData.end_date || null,
          location: formData.location,
          distance: formData.distances,
          description: formData.description || null,
        }),
      });

      if (res.ok) {
        showSuccess("Event berhasil diperbarui");
        fetchEventData(event.id);
      } else {
        showError("Gagal memperbarui event");
      }
    } catch {
      showError("Terjadi kesalahan saat memperbarui event");
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!event || !initialFormData)
    return (
      <div className="p-8 text-center text-foreground">
        Event tidak ditemukan
      </div>
    );

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

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
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
