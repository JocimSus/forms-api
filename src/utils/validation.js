import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const formCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
});

export const formUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
});
