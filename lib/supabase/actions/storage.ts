"use server";

import { createClient } from "@/lib/supabase/server";

export interface UploadAvatarResult {
    success: boolean;
    avatarUrl: string | null;
    error: string | null;
}

/**
 * Upload avatar to Supabase Storage
 * Automatically deletes old avatar if exists
 *
 * @param userId - The user ID for the avatar folder
 * @param file - The avatar file to upload
 * @returns UploadAvatarResult with avatarUrl on success
 */
export async function uploadAvatar(
    userId: string,
    file: File
): Promise<UploadAvatarResult> {
    const supabase = await createClient();

    try {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return {
                success: false,
                avatarUrl: null,
                error: "La taille du fichier ne doit pas dépasser 5 Mo.",
            };
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return {
                success: false,
                avatarUrl: null,
                error: "Le fichier doit être une image.",
            };
        }

        // Delete old avatars for this user
        const { data: existingFiles } = await supabase.storage
            .from("avatars")
            .list(userId);

        if (existingFiles && existingFiles.length > 0) {
            const filePaths = existingFiles.map((f) => `${userId}/${f.name}`);
            await supabase.storage.from("avatars").remove(filePaths);
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Upload file
        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            return {
                success: false,
                avatarUrl: null,
                error: uploadError.message,
            };
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        return {
            success: true,
            avatarUrl: publicUrl,
            error: null,
        };
    } catch (err) {
        return {
            success: false,
            avatarUrl: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de l'upload.",
        };
    }
}
