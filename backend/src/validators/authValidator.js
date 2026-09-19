import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string({ message: "Name is required." })
      .trim()
      .min(2, "Name must be at least 2 characters long.")
      .max(50, "Name must be at most 50 characters long."),

    email: z
      .string({ message: "Email is required." })
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address."),

    password: z
      .string({ message: "Password is required." })
      .min(6, "Password must be at least 6 characters long.")
      .max(100, "Password must be at most 100 characters long."),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string({ message: "Email is required." })
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address."),

    password: z
      .string({ message: "Password is required." })
      .min(1, "Password is required.")
      .max(100, "Password must be at most 100 characters long."),
  })
  .strict();