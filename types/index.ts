export interface DistanceDetail {
  name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  cot: string; // HH:mm
  price: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  end_date: string | null;
  location: string;
  distance: DistanceDetail[];
  description: string | null;
  created_at: string;
}

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  bib_number: string | null;
  distance: string | null;
  created_at: string;
}
