"use server";

import { createClient } from "@/lib/supabase/server";

export interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    created_at: string;
}

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
