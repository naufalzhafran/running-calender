"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createEventAction } from "@/app/admin/actions";
import { EventForm } from "@/components/admin/event-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toEventRequestBody } from "@/lib/event-form";
import { type EventFormData } from "@/types";

export default function CreateEventPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSubmit = async (formData: EventFormData) => {
    setError("");

    try {
      const result = await createEventAction(toEventRequestBody(formData));

      if (result.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }

      setError(result.message);
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
