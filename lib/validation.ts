import { z } from "zod";

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .or(z.literal(""));

export const loginPayloadSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(1).max(1024),
});

export const distanceDetailSchema = z.object({
  name: z.string().trim().min(1).max(100),
  date: dateStringSchema,
  start_time: timeStringSchema,
  cot: timeStringSchema,
});

export const eventPayloadSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    event_date: dateStringSchema,
    end_date: dateStringSchema.nullable().or(z.literal("")),
    location: z.string().trim().min(1).max(200),
    distance: z.array(distanceDetailSchema).max(20),
    description: z.string().max(10000).nullable().or(z.literal("")),
  })
  .transform((value) => ({
    ...value,
    end_date: value.end_date || null,
    description: value.description || null,
  }));

export type EventPayload = z.infer<typeof eventPayloadSchema>;
