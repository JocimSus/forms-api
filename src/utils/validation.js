import { z } from "zod";

export const registerSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const formCreateSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  questions: z
    .array(
      z.object({
        text: z.string(),
        type: z.enum([
          "SHORT_ANSWER",
          "MULTIPLE_CHOICE",
          "CHECKBOX",
          "DROPDOWN",
        ]),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});

export const formUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().nullable(),
});
