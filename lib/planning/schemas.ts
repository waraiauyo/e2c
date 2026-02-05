/**
 * Schémas de validation Zod pour les formulaires de planning
 */

import { z } from "zod";

/**
 * Schéma de validation pour le formulaire d'événement
 */
export const eventFormSchema = z
    .object({
        title: z
            .string()
            .min(1, "Le titre est requis")
            .max(255, "Le titre ne peut pas dépasser 255 caractères"),

        description: z
            .string()
            .max(1000, "La description ne peut pas dépasser 1000 caractères")
            .optional()
            .nullable(),

        location: z
            .string()
            .max(255, "Le lieu ne peut pas dépasser 255 caractères")
            .optional()
            .nullable(),

        start_time: z.date(),

        end_time: z.date(),

        all_day: z.boolean(),

        target_roles: z
            .array(z.enum(["animator", "coordinator", "director"]))
            .min(1, "Au moins un rôle cible est requis"),

        status: z.enum(["confirmed", "pending", "cancelled"]),

        participant_ids: z.array(z.string()),
    })
    .refine((data) => data.end_time > data.start_time, {
        message: "La date de fin doit être après la date de début",
        path: ["end_time"],
    });

export type EventFormValues = z.infer<typeof eventFormSchema>;
