import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["draft", "pending", "published", "cancelled"]).default("draft"),
  category: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  location: z
    .object({
      name: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
});

export const rsvpSchema = z.object({
  eventId: z.string().min(1),
  status: z.enum(["going", "maybe", "not-going"]),
  comment: z.string().optional(),
});

export const commentSchema = z.object({
  eventId: z.string().min(1),
  content: z.string().min(1),
  parentCommentId: z.string().optional(),
});
