"use server";

import { createClient } from "@/lib/supabase/server";

const DRIVE_BUCKET_NAME = "drive";

export interface StorageItemOwner {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
}

export interface StorageItem {
    id: string | null;
    name: string;
    created_at: string | null;
    updated_at: string | null;
    owner_id: string | null;
    owner: StorageItemOwner | null;
    metadata: {
        size?: number;
        mimetype?: string;
    } | null;
}

interface OwnerData {
    id: string;
    owner_id: string | null;
    owner_first_name: string | null;
    owner_last_name: string | null;
    owner_avatar_url: string | null;
}

export async function getFilesAndFolders(dirPath: string): Promise<StorageItem[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
        .from(DRIVE_BUCKET_NAME)
        .list(dirPath);

    if (error) throw Error(error.message);

    // Récupérer les owner_id et infos profil via la fonction RPC pour les fichiers (pas les dossiers)
    const fileIds = data.filter((item) => item.id).map((item) => item.id);

    let ownerMap: Record<string, OwnerData> = {};

    if (fileIds.length > 0) {
        const { data: ownersData, error: ownersError } = await supabase
            .rpc("get_drive_file_owners", { file_ids: fileIds });

        if (!ownersError && ownersData) {
            ownerMap = Object.fromEntries(
                ownersData.map((obj: OwnerData) => [obj.id, obj])
            );
        }
    }

    return data.map((item) => {
        const ownerData = item.id ? ownerMap[item.id] : null;
        return {
            id: item.id,
            name: item.name,
            created_at: item.created_at,
            updated_at: item.updated_at,
            owner_id: ownerData?.owner_id || null,
            owner: ownerData?.owner_id ? {
                id: ownerData.owner_id,
                first_name: ownerData.owner_first_name,
                last_name: ownerData.owner_last_name,
                avatar_url: ownerData.owner_avatar_url,
            } : null,
            metadata: item.metadata as StorageItem["metadata"],
        };
    });
}

export async function getFileDownloadUrl(filePath: string): Promise<string> {
    const supabase = await createClient();

    // Extraire le nom du fichier pour le header Content-Disposition
    const fileName = filePath.split("/").pop() || "download";

    const { data, error } = await supabase.storage
        .from(DRIVE_BUCKET_NAME)
        .createSignedUrl(filePath, 60, {
            download: fileName,
        });

    if (error) throw Error(error.message);

    return data.signedUrl;
}

export async function createFolder(folderPath: string): Promise<void> {
    const supabase = await createClient();

    // Supabase Storage crée un dossier en uploadant un fichier .keep vide
    const { error } = await supabase.storage
        .from(DRIVE_BUCKET_NAME)
        .upload(`${folderPath}/.keep`, new Blob([""]), {
            contentType: "text/plain",
        });

    if (error) throw Error(error.message);
}

export async function deleteFile(filePath: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.storage
        .from(DRIVE_BUCKET_NAME)
        .remove([filePath]);

    if (error) throw Error(error.message);
}

export async function deleteFolder(folderPath: string): Promise<void> {
    const supabase = await createClient();

    // Lister tous les fichiers dans le dossier
    const { data: files, error: listError } = await supabase.storage
        .from(DRIVE_BUCKET_NAME)
        .list(folderPath);

    if (listError) throw Error(listError.message);

    if (files && files.length > 0) {
        // Supprimer tous les fichiers du dossier
        const filePaths = files.map((file) => `${folderPath}/${file.name}`);
        const { error: removeError } = await supabase.storage
            .from(DRIVE_BUCKET_NAME)
            .remove(filePaths);

        if (removeError) throw Error(removeError.message);
    }
}

export async function moveFile(oldPath: string, newPath: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.storage
        .from(DRIVE_BUCKET_NAME)
        .move(oldPath, newPath);

    if (error) throw Error(error.message);
}

export async function renameFile(dirPath: string, oldName: string, newName: string): Promise<void> {
    const supabase = await createClient();

    const oldPath = dirPath ? `${dirPath}${oldName}` : oldName;
    const newPath = dirPath ? `${dirPath}${newName}` : newName;

    const { error } = await supabase.storage
        .from(DRIVE_BUCKET_NAME)
        .move(oldPath, newPath);

    if (error) throw Error(error.message);
}

export async function renameFolder(dirPath: string, oldName: string, newName: string): Promise<void> {
    const oldFolderPath = dirPath ? `${dirPath}${oldName}` : oldName;
    const newFolderPath = dirPath ? `${dirPath}${newName}` : newName;

    // Utiliser moveFolder pour renommer (déplacer vers le même parent avec un nouveau nom)
    await moveFolder(oldFolderPath, newFolderPath);
}

export async function moveFolder(oldFolderPath: string, newFolderPath: string): Promise<void> {
    const supabase = await createClient();

    // Lister tous les fichiers dans le dossier source
    const { data: files, error: listError } = await supabase.storage
        .from(DRIVE_BUCKET_NAME)
        .list(oldFolderPath);

    if (listError) throw Error(listError.message);

    if (files && files.length > 0) {
        // Déplacer chaque fichier vers le nouveau dossier
        for (const file of files) {
            const oldFilePath = `${oldFolderPath}/${file.name}`;
            const newFilePath = `${newFolderPath}/${file.name}`;

            // Si c'est un sous-dossier (pas d'id), récursion
            if (!file.id) {
                await moveFolder(oldFilePath, newFilePath);
            } else {
                const { error: moveError } = await supabase.storage
                    .from(DRIVE_BUCKET_NAME)
                    .move(oldFilePath, newFilePath);

                if (moveError) throw Error(moveError.message);
            }
        }
    }
}
