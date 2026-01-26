"use client";

import { useState, useCallback, useRef } from "react";
import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";

const DRIVE_BUCKET_NAME = "drive";
const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB

/**
 * Sanitize filename for S3/Supabase Storage compatibility
 * - Replaces spaces with underscores
 * - Removes special characters that are problematic for S3
 * - Normalizes accented characters to ASCII
 * - Preserves file extension
 * - Limits length to 200 characters
 */
function sanitizeFileName(fileName: string): string {
    // Separate name and extension
    const lastDotIndex = fileName.lastIndexOf(".");
    const hasExtension = lastDotIndex > 0;
    const name = hasExtension ? fileName.slice(0, lastDotIndex) : fileName;
    const extension = hasExtension ? fileName.slice(lastDotIndex) : "";

    // Normalize Unicode characters (é -> e, ç -> c, etc.)
    let sanitized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Replace spaces and problematic characters with underscores
    sanitized = sanitized.replace(/[\s&$@=;:+,?#%{}|\\^~\[\]`'"<>]/g, "_");

    // Remove any remaining non-safe characters (keep alphanumeric, underscore, hyphen, dot)
    sanitized = sanitized.replace(/[^a-zA-Z0-9_\-\.]/g, "");

    // Collapse multiple underscores
    sanitized = sanitized.replace(/_+/g, "_");

    // Remove leading/trailing underscores
    sanitized = sanitized.replace(/^_+|_+$/g, "");

    // Ensure name is not empty
    if (!sanitized) {
        sanitized = "file";
    }

    // Limit length (leaving room for extension)
    const maxNameLength = 200 - extension.length;
    if (sanitized.length > maxNameLength) {
        sanitized = sanitized.slice(0, maxNameLength);
    }

    return sanitized + extension.toLowerCase();
}

/**
 * Add numeric suffix to filename to make it unique
 * fichier.pdf -> fichier_1.pdf, fichier_2.pdf, etc.
 */
function addSuffixToFileName(fileName: string, suffix: number): string {
    const lastDotIndex = fileName.lastIndexOf(".");
    const hasExtension = lastDotIndex > 0;
    const name = hasExtension ? fileName.slice(0, lastDotIndex) : fileName;
    const extension = hasExtension ? fileName.slice(lastDotIndex) : "";
    return `${name}_${suffix}${extension}`;
}

/**
 * Generate unique filenames for a batch of files
 * Handles duplicates within the batch and against existing names
 */
function generateUniqueFileNames(
    files: File[],
    existingNames: Set<string>
): Map<File, string> {
    const result = new Map<File, string>();
    const usedNames = new Set(existingNames);

    for (const file of files) {
        let sanitized = sanitizeFileName(file.name);
        let finalName = sanitized;
        let counter = 1;

        // Keep incrementing suffix until we find a unique name
        while (usedNames.has(finalName.toLowerCase())) {
            finalName = addSuffixToFileName(sanitized, counter);
            counter++;
        }

        usedNames.add(finalName.toLowerCase());
        result.set(file, finalName);
    }

    return result;
}

export interface UploadingFile {
    id: string;
    file: File;
    name: string;           // Original file name (for display)
    sanitizedName: string;  // Sanitized name (for storage)
    progress: number;
    status: "pending" | "uploading" | "completed" | "error";
    error?: string;
    upload?: tus.Upload;
}

export interface UseFileUploadOptions {
    onComplete?: () => void;
    onError?: (fileName: string, error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const uploadsRef = useRef<Map<string, tus.Upload>>(new Map());

    const updateFile = useCallback((id: string, updates: Partial<UploadingFile>) => {
        setUploadingFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
        );
    }, []);

    const uploadFile = useCallback(
        async (file: File, dirPath: string, fileId: string, sanitizedName: string) => {
            const supabase = createClient();
            const { data: sessionData } = await supabase.auth.getSession();

            if (!sessionData.session) {
                updateFile(fileId, {
                    status: "error",
                    error: "Non authentifié",
                });
                options.onError?.(file.name, "Non authentifié");
                return;
            }

            const filePath = dirPath ? `${dirPath}${sanitizedName}` : sanitizedName;
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

            return new Promise<void>((resolve, reject) => {
                const upload = new tus.Upload(file, {
                    endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
                    retryDelays: [0, 3000, 5000, 10000, 20000],
                    headers: {
                        authorization: `Bearer ${sessionData.session.access_token}`,
                        "x-upsert": "false",
                    },
                    uploadDataDuringCreation: true,
                    removeFingerprintOnSuccess: true,
                    metadata: {
                        bucketName: DRIVE_BUCKET_NAME,
                        objectName: filePath,
                        contentType: file.type || "application/octet-stream",
                        cacheControl: "3600",
                    },
                    chunkSize: CHUNK_SIZE,
                    onError: (error) => {
                        console.error("Upload error:", error);
                        updateFile(fileId, {
                            status: "error",
                            error: error.message,
                        });
                        options.onError?.(file.name, error.message);
                        uploadsRef.current.delete(fileId);
                        reject(error);
                    },
                    onProgress: (bytesUploaded, bytesTotal) => {
                        const progress = Math.round((bytesUploaded / bytesTotal) * 100);
                        updateFile(fileId, { progress });
                    },
                    onSuccess: () => {
                        updateFile(fileId, {
                            status: "completed",
                            progress: 100,
                        });
                        uploadsRef.current.delete(fileId);
                        resolve();
                    },
                });

                uploadsRef.current.set(fileId, upload);
                updateFile(fileId, { status: "uploading", upload });
                upload.start();
            });
        },
        [updateFile, options]
    );

    const uploadFiles = useCallback(
        async (files: File[], dirPath: string, existingFileNames: string[] = []) => {
            if (files.length === 0) return;

            setIsUploading(true);

            // Build set of existing names (from storage + currently uploading)
            const existingNames = new Set<string>(
                existingFileNames.map((n) => n.toLowerCase())
            );

            // Add names of files currently being uploaded
            uploadingFiles.forEach((uf) => {
                if (uf.status !== "error") {
                    existingNames.add(uf.sanitizedName.toLowerCase());
                }
            });

            // Generate unique names for all files in this batch
            const uniqueNames = generateUniqueFileNames(files, existingNames);

            const newFiles: UploadingFile[] = files.map((file) => ({
                id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file,
                name: file.name,
                sanitizedName: uniqueNames.get(file)!,
                progress: 0,
                status: "pending" as const,
            }));

            setUploadingFiles((prev) => [...prev, ...newFiles]);

            const uploadPromises = newFiles.map((uf) =>
                uploadFile(uf.file, dirPath, uf.id, uf.sanitizedName).catch(() => {
                    // Error already handled in uploadFile
                })
            );

            await Promise.all(uploadPromises);
            setIsUploading(false);
            options.onComplete?.();
        },
        [uploadFile, options, uploadingFiles]
    );

    const cancelUpload = useCallback((fileId: string) => {
        const upload = uploadsRef.current.get(fileId);
        if (upload) {
            upload.abort();
            uploadsRef.current.delete(fileId);
        }
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);

    const cancelAllUploads = useCallback(() => {
        uploadsRef.current.forEach((upload) => upload.abort());
        uploadsRef.current.clear();
        setUploadingFiles([]);
        setIsUploading(false);
    }, []);

    const clearCompleted = useCallback(() => {
        setUploadingFiles((prev) =>
            prev.filter((f) => f.status !== "completed" && f.status !== "error")
        );
    }, []);

    const totalProgress = uploadingFiles.length > 0
        ? Math.round(
              uploadingFiles.reduce((acc, f) => acc + f.progress, 0) / uploadingFiles.length
          )
        : 0;

    const completedCount = uploadingFiles.filter((f) => f.status === "completed").length;
    const errorCount = uploadingFiles.filter((f) => f.status === "error").length;

    return {
        uploadingFiles,
        isUploading,
        totalProgress,
        completedCount,
        errorCount,
        uploadFiles,
        cancelUpload,
        cancelAllUploads,
        clearCompleted,
    };
}
