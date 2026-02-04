export interface DistanceDetail {
  name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  cot: string; // HH:mm
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: Date;
  end_date: Date | null;
  location: string;
  distance: DistanceDetail[];
  description: string | null;
  created_at: Date;
}

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  bib_number: string | null;
  distance: string | null;
  created_at: Date;
}
