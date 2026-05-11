import { notFound } from "next/navigation";

import { getEventById } from "@/lib/data";
import { EditEventPageClient } from "./edit-event-page-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  return <EditEventPageClient event={event} />;
}
