"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EventForm, EventFormData } from "@/components/admin/event-form";

export default function CreateEventPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSubmit = async (formData: EventFormData) => {
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
          distance: JSON.stringify(formData.distances),
          description: formData.description,
        }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.message || "Gagal membuat event");
      }
    } catch {
      setError("Terjadi kesalahan");
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

            <EventForm
              onSubmit={handleSubmit}
              submitLabel="Buat Event"
              loadingLabel="Membuat..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
