"use server";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export type UserProfile = Profile;

export interface GetProfileResult {
    profile: UserProfile | null;
    error: string | null;
}

export async function getUserProfile(
    userId: string
): Promise<GetProfileResult> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            return {
                profile: null,
                error: error.message,
            };
        }

        return {
            profile: data,
            error: null,
        };
    } catch (err) {
        return {
            profile: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération du profil.",
        };
    }
}

// Fonction pour récupérer le profil de l'utilisateur actuellement connecté
export async function getCurrentUserProfile(): Promise<GetProfileResult> {
    const supabase = await createClient();

    try {
        // Récupére l'utilisateur actuellement connecté
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                profile: null,
                error: authError?.message || "Utilisateur non connecté.",
            };
        }

        // Récupére le profil associé
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (error) {
            return {
                profile: null,
                error: error.message,
            };
        }

        return {
            profile: data,
            error: null,
        };
    } catch (err) {
        return {
            profile: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la récupération du profil.",
        };
    }
}

/**
 * Récupère tous les utilisateurs (pour sélection de participants)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("first_name", { ascending: true });

        if (error) {
            throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
        }

        return data as UserProfile[];
    } catch (err) {
        console.error("Error fetching users:", err);
        return [];
    }
}
