CREATE TABLE events (
  id           INTEGER PRIMARY KEY,
  slug         TEXT    NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 200),
  title        TEXT    NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  event_date   TEXT    NOT NULL
               CHECK (event_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  end_date     TEXT    NULL
               CHECK (end_date IS NULL OR (
                 end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
                 AND end_date >= event_date)),
  location     TEXT    NOT NULL CHECK (length(location) BETWEEN 1 AND 200),
  description  TEXT    NULL CHECK (description IS NULL OR length(description) <= 10000),
  last_date    TEXT    GENERATED ALWAYS AS (COALESCE(end_date, event_date)) STORED,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
) STRICT;

CREATE INDEX idx_events_event_date ON events (event_date);
CREATE INDEX idx_events_last_date ON events (last_date);

CREATE TABLE event_distances (
  id          INTEGER PRIMARY KEY,
  event_id    INTEGER NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  name        TEXT    NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  race_date   TEXT    NOT NULL
              CHECK (race_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  start_time  TEXT    NULL CHECK (start_time IS NULL OR start_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  cot         TEXT    NULL CHECK (cot IS NULL OR cot GLOB '[0-2][0-9]:[0-5][0-9]'),
  UNIQUE (event_id, position),
  UNIQUE (event_id, name)
) STRICT;

CREATE INDEX idx_event_distances_event ON event_distances (event_id);

CREATE TABLE api_tokens (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE CHECK (length(name) BETWEEN 1 AND 100),
  token_hash    TEXT NOT NULL UNIQUE,
  token_prefix  TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  last_used_at  TEXT NULL,
  revoked_at    TEXT NULL
) STRICT;
