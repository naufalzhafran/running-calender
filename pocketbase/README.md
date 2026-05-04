# PocketBase Setup

This app expects PocketBase at `POCKETBASE_URL` and uses one auth collection plus two base collections.

If you want to import the schema directly, use [collections.import.json](/Users/naufalzhafran/Documents/personal/running-calender/pocketbase/collections.import.json:1).

## 1. Create `admins` auth collection

- Name: `admins`
- Type: `auth`
- Password auth: enabled
- Identity fields: `email`
- List rule: `@request.auth.collectionName = "admins"`
- View rule: `@request.auth.collectionName = "admins"`
- Create rule: empty
- Update rule: `@request.auth.collectionName = "admins"`
- Delete rule: `@request.auth.collectionName = "admins"`
- Auth rule: empty
- Manage rule: `@request.auth.collectionName = "admins"`

Create at least one admin record in this collection. The Next.js login page uses email + password.

## 2. Create `events` base collection

- Name: `events`
- Type: `base`
- List rule: `""` (public)
- View rule: `""` (public)
- Create rule: `@request.auth.collectionName = "admins"`
- Update rule: `@request.auth.collectionName = "admins"`
- Delete rule: `@request.auth.collectionName = "admins"`

Fields:

- `title` — `text`, required
- `slug` — `text`, required, unique index
- `event_date` — `date`, required
- `end_date` — `date`, optional
- `location` — `text`, required
- `distance` — `json`, required
- `description` — `editor` or `text`, optional

Recommended index:

```sql
CREATE UNIQUE INDEX idx_events_slug ON events (slug);
CREATE INDEX idx_events_event_date ON events (event_date);
```

The `distance` JSON field should contain an array like:

```json
[
  {
    "name": "10K",
    "date": "2026-05-10",
    "start_time": "05:30",
    "cot": "07:30",
    "price": "250000"
  }
]
```

## 3. Create `participants` base collection

- Name: `participants`
- Type: `base`
- List rule: `""` (public)
- View rule: `""` (public)
- Create rule: `@request.auth.collectionName = "admins"`
- Update rule: `@request.auth.collectionName = "admins"`
- Delete rule: `@request.auth.collectionName = "admins"`

Fields:

- `event_id` — `relation`, required, single select, target collection `events`
- `name` — `text`, required
- `bib_number` — `text`, optional
- `distance` — `text`, optional

Recommended index:

```sql
CREATE INDEX idx_participants_event_id ON participants (event_id);
CREATE INDEX idx_participants_name ON participants (name);
```

## Notes

- Public pages read `events` and `participants` anonymously, so the list/view rules must stay open.
- In PocketBase exports/imports, public rules are `""`, not `null`.
- Admin mutations rely on the logged-in `admins` record token stored in the `pb_auth` cookie.
- If you rename the auth collection, set `POCKETBASE_ADMIN_COLLECTION` to match.
