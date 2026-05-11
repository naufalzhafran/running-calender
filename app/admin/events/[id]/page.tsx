import { EditEventPageClient } from "./edit-event-page-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  return <EditEventPageClient eventId={id} />;
}
