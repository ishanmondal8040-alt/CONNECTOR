import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z
      .string({ message: "Name must be text." })
      .trim()
      .min(2, "Name must be at least 2 characters long.")
      .max(50, "Name must be at most 50 characters long.")
      .optional(),

    bio: z
      .string({ message: "Bio must be text." })
      .trim()
      .max(300, "Bio must be at most 300 characters long.")
      .nullable()
      .optional(),

    profileImage: z
      .string({ message: "Profile image must be text." })
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message:
        "Please provide at least one field to update: name, bio, or profileImage.",
    }
  );