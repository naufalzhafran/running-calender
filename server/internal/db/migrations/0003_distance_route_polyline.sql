-- Course geometry per distance as a Google encoded polyline (precision 5),
-- drawn on the event page map.
ALTER TABLE event_distances ADD COLUMN route_polyline TEXT NULL
  CHECK (route_polyline IS NULL OR length(route_polyline) BETWEEN 1 AND 20000);
