"use server";

import { createClient } from "@/lib/supabase/server";

export interface UpdateAvatarUrlResult {
    success: boolean;
    message: string;
}

/**
 * Update avatar_url in profiles table
 *
 * @param userId - The user ID whose avatar_url to update
 * @param avatarUrl - The new avatar URL from Storage
 * @returns UpdateAvatarUrlResult with success status
 */
export async function updateAvatarUrl(
    userId: string,
    avatarUrl: string
): Promise<UpdateAvatarUrlResult> {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from("profiles")
            .update({
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

        if (error) {
            return {
                success: false,
                message: error.message,
            };
        }

        return {
            success: true,
            message: "Avatar mis à jour avec succès.",
        };
    } catch (err) {
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la mise à jour.",
        };
    }
}

export interface UpdatePhoneResult {
    success: boolean;
    message: string;
}

/**
 * Update phone number in profiles table
 *
 * @param userId - The user ID whose phone to update
 * @param phone - The new phone number
 * @returns UpdatePhoneResult with success status
 */
export async function updatePhone(
    userId: string,
    phone: string
): Promise<UpdatePhoneResult> {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from("profiles")
            .update({
                phone: phone,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

        if (error) {
            return {
                success: false,
                message: error.message,
            };
        }

        return {
            success: true,
            message: "Numéro de téléphone mis à jour avec succès.",
        };
    } catch (err) {
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de la mise à jour.",
        };
    }
}
