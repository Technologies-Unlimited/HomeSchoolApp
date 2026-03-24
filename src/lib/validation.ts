import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  phone: z
    .string()
    .min(7, "Phone number must be at least 7 characters")
    .max(20, "Phone number must be at most 20 characters")
    .regex(/^[\d\s+\-()]+$/, "Phone number can only contain digits, spaces, +, -, and parentheses"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const eventSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(["draft", "pending", "published", "cancelled"]).default("draft"),
    category: z.string().optional(),
    startDate: z.string().min(1).refine((val) => !isNaN(Date.parse(val)), {
      message: "startDate must be a valid date",
    }),
    endDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "endDate must be a valid date",
    }),
    location: z
      .object({
        name: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: "endDate must be on or after startDate", path: ["endDate"] }
  );

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
