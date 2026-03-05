import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const gameLogSchema = z.object({
    rawgId: z.number().int().positive("Game ID is required"),
    gameName: z.string().min(1, "Game name is required"),
    gameSlug: z.string().optional(),
    gameImage: z.string().optional(),
    gameReleased: z.string().optional(),
    gameMetacritic: z.number().int().optional(),
    gameGenres: z.string().optional(),
    gamePlatforms: z.string().optional(),
    gameDevelopers: z.string().optional(),
    status: z
        .enum(["PLAN_TO_PLAY", "PLAYING", "COMPLETED"])
        .default("PLAN_TO_PLAY"),
    rating: z.number().int().min(1).max(10).optional(),
    hoursPlayed: z.number().min(0).optional(),
    platforms: z.string().optional(),
    notes: z.string().optional(),
    startedAt: z.string().optional(),
    completedAt: z.string().optional(),
});

export const createGameLogSchema = gameLogSchema;

export const updateGameLogSchema = z.object({
    status: z.enum(["PLAN_TO_PLAY", "PLAYING", "COMPLETED"]).optional(),
    rating: z.number().int().min(1).max(10).optional().nullable(),
    hoursPlayed: z.number().min(0).optional().nullable(),
    platforms: z.string().optional(),
    notes: z.string().optional(),
    startedAt: z.string().optional().nullable(),
    completedAt: z.string().optional().nullable(),
});

export const updateProfileSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        email: z.string().email("Invalid email address").optional(),
        newPassword: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z
                .string()
                .min(6, "Password must be at least 6 characters")
                .optional(),
        ),
    })
    .refine((data) => data.email || data.newPassword, {
        message: "Either email or new password must be provided",
        path: ["email"],
    });

export const createUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(1, "Name is required"),
    isAdmin: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type GameLogFormData = z.infer<typeof gameLogSchema>;
export type UpdateGameLogFormData = z.infer<typeof updateGameLogSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
