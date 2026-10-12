# Event data

Every `*.json` file in this folder is imported into PocketBase by the
`Sync events` GitHub Action when it changes on `main`. A file holds one event
or an array of events in the `npm run events -- schema create` format; see
`scripts/events.import.example.json`.

Events are matched by `slug` (derived from `title` when omitted), so keep the
title or slug stable when editing an entry. Existing events only receive the
fields listed here; removing an entry does not delete the event.
