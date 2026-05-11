import { toDateInputValue } from "@/lib/date";
import { type Event, type EventFormData } from "@/types";

export function toEventRequestBody(formData: EventFormData) {
  return {
    title: formData.title,
    slug: formData.slug,
    event_date: formData.event_date,
    end_date: formData.end_date || null,
    location: formData.location,
    distance: formData.distances,
    description: formData.description || null,
  };
}

export function eventToFormData(event: Event): EventFormData {
  const eventDate = toDateInputValue(event.event_date);

  return {
    title: event.title,
    slug: event.slug,
    event_date: eventDate,
    end_date: event.end_date ? toDateInputValue(event.end_date) : "",
    location: event.location,
    distances: event.distance.map((distance) => ({
      ...distance,
      date: distance.date ? toDateInputValue(distance.date) : eventDate,
    })),
    description: event.description || "",
  };
}
