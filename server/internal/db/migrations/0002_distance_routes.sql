-- Route info per distance: a course map link and the cut-off points (COP)
-- along the course, stored as a JSON array of {name, km, cot}.
ALTER TABLE event_distances ADD COLUMN route_url TEXT NULL
  CHECK (route_url IS NULL OR length(route_url) BETWEEN 1 AND 500);

ALTER TABLE event_distances ADD COLUMN cut_off_points TEXT NULL
  CHECK (cut_off_points IS NULL OR json_valid(cut_off_points));
