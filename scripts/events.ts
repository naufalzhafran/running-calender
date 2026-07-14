import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "dotenv";
import { z } from "zod";

import { toDateInputValue } from "@/lib/date";
import { createSlug } from "@/lib/event-utils";
import { eventPayloadSchema } from "@/lib/validation";
import { type Event } from "@/types";

config({
  path: [resolve(process.cwd(), ".env.local"), resolve(process.cwd(), ".env")],
  quiet: true,
});

const DEFAULT_APP_URL = "http://127.0.0.1:5678";
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/).or(z.literal(""));
const distanceInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    date: dateSchema.optional(),
    start_time: timeSchema.optional(),
    cot: timeSchema.optional(),
  })
  .strict();
const editableFieldsSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    event_date: dateSchema,
    end_date: dateSchema.nullable(),
    location: z.string().trim().min(1).max(200),
    distance: z.array(distanceInputSchema).max(20),
    description: z.string().max(10000).nullable(),
  })
  .strict();
const createInputSchema = editableFieldsSchema
  .omit({ slug: true, end_date: true, distance: true, description: true })
  .extend({
    slug: editableFieldsSchema.shape.slug.optional(),
    end_date: editableFieldsSchema.shape.end_date.optional(),
    distance: editableFieldsSchema.shape.distance.optional(),
    description: editableFieldsSchema.shape.description.optional(),
  });
const updateInputSchema = editableFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Provide at least one field to update" },
);

type CreateInput = z.infer<typeof createInputSchema>;
type UpdateInput = z.infer<typeof updateInputSchema>;

function printHelp() {
  process.stdout.write(`Codex event data interface

Usage:
  npm run events -- list [--url <url>]
  npm run events -- get <id-or-slug> [--url <url>]
  npm run events -- schema [create|update]
  npm run events -- create <file.json> [--dry-run] [--url <url>]
  npm run events -- update <id-or-slug> <file.json> [--dry-run] [--url <url>]
  npm run events -- delete <id-or-slug> [--yes] [--url <url>]

Create and update accept JSON files. Update files are patches, so include only
the fields that should change. Delete previews the target unless --yes is used.

Environment:
  RUNNING_CALENDAR_URL       App URL (falls back to SITE_URL or ${DEFAULT_APP_URL})
  POCKETBASE_ADMIN_EMAIL     Admin login email
  POCKETBASE_ADMIN_PASSWORD  Admin login password
`);
}

function printJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function formatIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

function parseArguments(args: string[]) {
  const positionals: string[] = [];
  let appUrl: string | undefined;
  let dryRun = false;
  let confirmed = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--url") {
      appUrl = args[index + 1];
      if (!appUrl || appUrl.startsWith("--")) {
        throw new Error("--url requires a value");
      }
      index += 1;
      continue;
    }

    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (argument === "--yes") {
      confirmed = true;
      continue;
    }

    if (argument.startsWith("--")) {
      throw new Error(`Unknown option: ${argument}`);
    }

    positionals.push(argument);
  }

  return {
    positionals,
    dryRun,
    confirmed,
    appUrl: (
      appUrl ??
      process.env.RUNNING_CALENDAR_URL ??
      process.env.SITE_URL ??
      DEFAULT_APP_URL
    ).replace(/\/$/, ""),
  };
}

async function readJsonFile(filePath: string) {
  try {
    return JSON.parse(
      await readFile(resolve(process.cwd(), filePath), "utf8"),
    ) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
    }

    throw error;
  }
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      `Expected JSON from ${response.url}, received HTTP ${response.status}`,
    );
  }
}

async function login(appUrl: string) {
  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD are required",
    );
  }

  const response = await fetch(`${appUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const result = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      typeof result.message === "string"
        ? `Login failed: ${result.message}`
        : `Login failed with HTTP ${response.status}`,
    );
  }

  const cookie = response.headers.get("set-cookie")?.split(";", 1)[0];
  if (!cookie) {
    throw new Error("Login succeeded but no auth cookie was returned");
  }

  return cookie;
}

async function apiRequest(
  appUrl: string,
  cookie: string,
  path: string,
  init?: RequestInit,
) {
  const response = await fetch(`${appUrl}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Cookie: cookie,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const result = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      typeof result.message === "string"
        ? result.message
        : `Request failed with HTTP ${response.status}`,
    );
  }

  return result;
}

async function listEvents(appUrl: string, cookie: string) {
  const result = await apiRequest(appUrl, cookie, "/api/admin/events");

  if (!Array.isArray(result)) {
    throw new Error("Admin events endpoint returned an invalid response");
  }

  return result as unknown as Event[];
}

async function findEvent(appUrl: string, cookie: string, reference: string) {
  const events = await listEvents(appUrl, cookie);
  const event = events.find(
    (candidate) =>
      candidate.id === reference || candidate.slug === reference,
  );

  if (!event) {
    throw new Error(`Event not found: ${reference}`);
  }

  return event;
}

function normalizeDistances(
  distances: z.infer<typeof distanceInputSchema>[],
  eventDate: string,
) {
  return distances.map((distance) => ({
    name: distance.name,
    date: distance.date ?? eventDate,
    start_time: distance.start_time ?? "",
    cot: distance.cot ?? "",
  }));
}

function normalizeCreate(input: CreateInput) {
  return eventPayloadSchema.parse({
    title: input.title,
    slug: input.slug ?? createSlug(input.title),
    event_date: input.event_date,
    end_date: input.end_date ?? null,
    location: input.location,
    distance: normalizeDistances(input.distance ?? [], input.event_date),
    description: input.description ?? null,
  });
}

function normalizeUpdate(event: Event, input: UpdateInput) {
  const eventDate = input.event_date ?? toDateInputValue(event.event_date);
  const distances = input.distance
    ? normalizeDistances(input.distance, eventDate)
    : event.distance.map((distance) => ({
        ...distance,
        date: toDateInputValue(distance.date),
      }));

  return eventPayloadSchema.parse({
    title: input.title ?? event.title,
    slug: input.slug ?? event.slug,
    event_date: eventDate,
    end_date:
      input.end_date === undefined
        ? event.end_date
          ? toDateInputValue(event.end_date)
          : null
        : input.end_date,
    location: input.location ?? event.location,
    distance: distances,
    description:
      input.description === undefined ? event.description : input.description,
  });
}

function parseFile<T>(schema: z.ZodType<T>, input: unknown) {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    printJson({
      ok: false,
      message: "Invalid event data",
      issues: formatIssues(parsed.error),
    });
    process.exitCode = 1;
    return null;
  }

  return parsed.data;
}

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  const { positionals, dryRun, confirmed, appUrl } = parseArguments(args);

  if (command === "schema") {
    const target = positionals[0];
    if (target && target !== "create" && target !== "update") {
      throw new Error("Schema target must be create or update");
    }

    printJson(
      target === "create"
        ? z.toJSONSchema(createInputSchema)
        : target === "update"
          ? z.toJSONSchema(updateInputSchema)
          : {
              create: z.toJSONSchema(createInputSchema),
              update: z.toJSONSchema(updateInputSchema),
            },
    );
    return;
  }

  if (command === "create") {
    const filePath = positionals[0];
    if (!filePath) {
      throw new Error("create requires a JSON file path");
    }

    const input = parseFile(createInputSchema, await readJsonFile(filePath));
    if (!input) return;
    const payload = normalizeCreate(input);

    if (dryRun) {
      printJson({ ok: true, dry_run: true, event: payload });
      return;
    }

    const cookie = await login(appUrl);
    const event = await apiRequest(appUrl, cookie, "/api/admin/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    printJson({ ok: true, event });
    return;
  }

  if (!["list", "get", "update", "delete"].includes(command)) {
    throw new Error(`Unknown command: ${command}`);
  }

  const cookie = await login(appUrl);

  if (command === "list") {
    printJson(await listEvents(appUrl, cookie));
    return;
  }

  const reference = positionals[0];
  if (!reference) {
    throw new Error(`${command} requires an event id or slug`);
  }

  const event = await findEvent(appUrl, cookie, reference);

  if (command === "get") {
    printJson(event);
    return;
  }

  if (command === "update") {
    const filePath = positionals[1];
    if (!filePath) {
      throw new Error("update requires a JSON patch file path");
    }

    const input = parseFile(updateInputSchema, await readJsonFile(filePath));
    if (!input) return;
    const payload = normalizeUpdate(event, input);

    if (dryRun) {
      printJson({ ok: true, dry_run: true, before: event, after: payload });
      return;
    }

    const updated = await apiRequest(
      appUrl,
      cookie,
      `/api/admin/events/${event.id}`,
      { method: "PUT", body: JSON.stringify(payload) },
    );
    printJson({ ok: true, event: updated });
    return;
  }

  if (command === "delete") {
    if (!confirmed) {
      printJson({
        ok: true,
        dry_run: true,
        event,
        message: "Run again with --yes to delete this event",
      });
      return;
    }

    await apiRequest(appUrl, cookie, `/api/admin/events/${event.id}`, {
      method: "DELETE",
    });
    printJson({ ok: true, deleted: event });
    return;
  }
}

main().catch((error: unknown) => {
  printJson({
    ok: false,
    message: error instanceof Error ? error.message : "Unknown error",
  });
  process.exitCode = 1;
});
