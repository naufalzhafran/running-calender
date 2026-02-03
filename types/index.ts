export interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: Date;
  location: string;
  distance: string;
  description: string | null;
  created_at: Date;
}

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  bib_number: string | null;
  created_at: Date;
}
