"use server";

import { createClient } from "@/lib/supabase/server";

const DRIVE_BUCKET_NAME = "drive";

export async function getFilesAndFolders(dirPath: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
        .from(DRIVE_BUCKET_NAME)
        .list(dirPath);

    if (error) throw Error(error.message); //TODO : faire la gestion d'erreur

    return data;
}
