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
  event_date: string;
  end_date: string | null;
  location: string;
  distance: DistanceDetail[];
  description: string | null;
  created_at: string;
}
