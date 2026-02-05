"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
    CheckCircle2,
    ChevronRight,
    Download,
    Eye,
    File,
    FileArchive,
    FileAudio,
    FileCode,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileVideo,
    Folder,
    FolderPlus,
    HardDrive,
    MoreHorizontal,
    Pencil,
    Presentation,
    Trash2,
    Upload,
    X,
    XCircle,
} from "lucide-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/shadcn/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { LoadingSpinner } from "@/components/shadcn/loading-spinner";
import { Progress } from "@/components/shadcn/progress";

import { useFileUpload } from "@/hooks/use-file-upload";
import { useAppSelector } from "@/lib/redux/hooks";

import {
    createFolder,
    deleteFile,
    deleteFolder,
    getFileDownloadUrl,
    getFilesAndFolders,
    moveFile,
    moveFolder,
    renameFile,
    renameFolder,
    type StorageItem,
} from "@/lib/supabase/query/storage";

type FileIconInfo = {
    icon: typeof File;
    className: string;
};

const FOLDER_ICON: FileIconInfo = { icon: Folder, className: "text-amber-500" };
const DEFAULT_FILE_ICON: FileIconInfo = {
    icon: File,
    className: "text-muted-foreground",
};

const FILE_ICONS: Record<string, FileIconInfo> = {
    // Images
    jpg: { icon: FileImage, className: "text-pink-500" },
    jpeg: { icon: FileImage, className: "text-pink-500" },
    png: { icon: FileImage, className: "text-pink-500" },
    gif: { icon: FileImage, className: "text-pink-500" },
    webp: { icon: FileImage, className: "text-pink-500" },
    svg: { icon: FileImage, className: "text-pink-500" },
    // Videos
    mp4: { icon: FileVideo, className: "text-purple-500" },
    webm: { icon: FileVideo, className: "text-purple-500" },
    mov: { icon: FileVideo, className: "text-purple-500" },
    avi: { icon: FileVideo, className: "text-purple-500" },
    // Audio
    mp3: { icon: FileAudio, className: "text-green-500" },
    wav: { icon: FileAudio, className: "text-green-500" },
    ogg: { icon: FileAudio, className: "text-green-500" },
    flac: { icon: FileAudio, className: "text-green-500" },
    // Archives
    zip: { icon: FileArchive, className: "text-amber-600" },
    rar: { icon: FileArchive, className: "text-amber-600" },
    "7z": { icon: FileArchive, className: "text-amber-600" },
    tar: { icon: FileArchive, className: "text-amber-600" },
    gz: { icon: FileArchive, className: "text-amber-600" },
    // Documents
    pdf: { icon: FileText, className: "text-red-500" },
    doc: { icon: FileText, className: "text-blue-600" },
    docx: { icon: FileText, className: "text-blue-600" },
    txt: { icon: FileText, className: "text-muted-foreground" },
    md: { icon: FileText, className: "text-muted-foreground" },
    // Spreadsheets
    xls: { icon: FileSpreadsheet, className: "text-green-600" },
    xlsx: { icon: FileSpreadsheet, className: "text-green-600" },
    csv: { icon: FileSpreadsheet, className: "text-green-600" },
    // Presentations
    ppt: { icon: Presentation, className: "text-orange-500" },
    pptx: { icon: Presentation, className: "text-orange-500" },
    // Code
    js: { icon: FileCode, className: "text-yellow-500" },
    ts: { icon: FileCode, className: "text-blue-500" },
    html: { icon: FileCode, className: "text-orange-500" },
    css: { icon: FileCode, className: "text-blue-400" },
    json: { icon: FileCode, className: "text-yellow-600" },
};

function getFileIcon(filename: string): FileIconInfo {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return FILE_ICONS[ext] || DEFAULT_FILE_ICON;
}

function formatFileSize(bytes?: number): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

type PreviewType = "image" | "video" | "audio" | "pdf" | null;

const PREVIEW_EXTENSIONS: Record<string, PreviewType> = {
    // Images
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    svg: "image",
    // Videos
    mp4: "video",
    webm: "video",
    mov: "video",
    // Audio
    mp3: "audio",
    wav: "audio",
    ogg: "audio",
    // PDF
    pdf: "pdf",
};

function getPreviewType(filename: string): PreviewType {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return PREVIEW_EXTENSIONS[ext] || null;
}

export default function DrivePage() {
    const { profile } = useAppSelector((state) => state.user);

    const [files, setFiles] = useState<StorageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dirPath, setDirPath] = useState("");

    // Vérifie si l'utilisateur peut modifier/supprimer un élément
    const canModify = useCallback(
        (item: StorageItem): boolean => {
            if (!profile) return false;
            // Les admins peuvent tout faire
            if (profile.account_type === "admin") return true;
            // Les dossiers peuvent être modifiés par tous (pas de owner_id)
            if (!item.id) return true;
            // Le propriétaire peut modifier son fichier
            return item.owner_id === profile.id;
        },
        [profile]
    );

    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [creatingFolder, setCreatingFolder] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<StorageItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [itemToRename, setItemToRename] = useState<StorageItem | null>(null);
    const [newItemName, setNewItemName] = useState("");
    const [renaming, setRenaming] = useState(false);

    // Preview state
    const [previewItem, setPreviewItem] = useState<StorageItem | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Selection state
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [deleteMultipleDialogOpen, setDeleteMultipleDialogOpen] =
        useState(false);
    const [deletingMultiple, setDeletingMultiple] = useState(false);

    // Drag & drop state (for moving items)
    const [draggedItem, setDraggedItem] = useState<StorageItem | null>(null);
    const [dropTargetFolder, setDropTargetFolder] = useState<string | null>(
        null
    );
    const [dropTargetBreadcrumb, setDropTargetBreadcrumb] = useState<
        number | null
    >(null);

    // File upload state
    const [isDraggingFiles, setIsDraggingFiles] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounterRef = useRef(0);

    const {
        uploadingFiles,
        isUploading,
        totalProgress,
        completedCount,
        uploadFiles,
        cancelUpload,
        cancelAllUploads,
    } = useFileUpload({
        onComplete: () => {
            fetchFiles();
        },
    });

    const pathSegments = dirPath.split("/").filter(Boolean);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const data = await getFilesAndFolders(dirPath);
            setFiles(data.filter((item) => item.name !== ".keep"));
        } catch (error) {
            console.error("Erreur lors du chargement:", error);
            toast.error("Erreur lors du chargement des fichiers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dirPath]);

    const openFolder = (folderName: string) => {
        setDirPath((prev) => `${prev}${folderName}/`);
    };

    const goToPath = (index: number) => {
        if (index === -1) {
            setDirPath("");
        } else {
            setDirPath(pathSegments.slice(0, index + 1).join("/") + "/");
        }
    };

    const handleDownload = async (file: StorageItem) => {
        try {
            const url = await getFileDownloadUrl(dirPath + file.name);
            window.open(url, "_blank");
        } catch (error) {
            console.error("Erreur lors du téléchargement:", error);
            toast.error("Erreur lors du téléchargement");
        }
    };

    const handleCreateFolder = async () => {
        const name = newFolderName.trim();
        if (!name) {
            toast.error("Le nom du dossier ne peut pas être vide");
            return;
        }

        setCreatingFolder(true);
        try {
            await createFolder(dirPath + name);
            toast.success("Dossier créé avec succès");
            setNewFolderOpen(false);
            setNewFolderName("");
            fetchFiles();
        } catch (error) {
            console.error("Erreur lors de la création:", error);
            toast.error("Erreur lors de la création du dossier");
        } finally {
            setCreatingFolder(false);
        }
    };

    const handleDeleteClick = (item: StorageItem) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleRenameClick = (item: StorageItem) => {
        setItemToRename(item);
        setNewItemName(item.name);
        setRenameDialogOpen(true);
    };

    const handlePreviewClick = async (item: StorageItem) => {
        const previewType = getPreviewType(item.name);
        if (!previewType) return;

        setPreviewItem(item);
        setPreviewLoading(true);

        try {
            const url = await getFileDownloadUrl(dirPath + item.name);
            setPreviewUrl(url);
        } catch (error) {
            console.error("Erreur lors du chargement:", error);
            toast.error("Erreur lors du chargement de la prévisualisation");
            setPreviewItem(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const closePreview = () => {
        setPreviewItem(null);
        setPreviewUrl(null);
    };

    const handleConfirmRename = async () => {
        if (!itemToRename) return;

        const trimmedName = newItemName.trim();
        if (!trimmedName) {
            toast.error("Le nom ne peut pas être vide");
            return;
        }

        if (trimmedName === itemToRename.name) {
            setRenameDialogOpen(false);
            return;
        }

        const isFolder = !itemToRename.id;

        setRenaming(true);
        try {
            if (isFolder) {
                await renameFolder(dirPath, itemToRename.name, trimmedName);
            } else {
                await renameFile(dirPath, itemToRename.name, trimmedName);
            }
            toast.success(isFolder ? "Dossier renommé" : "Fichier renommé");
            setRenameDialogOpen(false);
            setItemToRename(null);
            fetchFiles();
        } catch (error) {
            console.error("Erreur lors du renommage:", error);
            toast.error("Erreur lors du renommage");
        } finally {
            setRenaming(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        const isFolder = !itemToDelete.id;
        const itemPath = dirPath + itemToDelete.name;

        setDeleting(true);
        try {
            if (isFolder) {
                await deleteFolder(itemPath);
            } else {
                await deleteFile(itemPath);
            }
            toast.success(isFolder ? "Dossier supprimé" : "Fichier supprimé");
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            fetchFiles();
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            toast.error("Erreur lors de la suppression");
        } finally {
            setDeleting(false);
        }
    };

    // Drag & drop handlers
    const [isDraggingSelection, setIsDraggingSelection] = useState(false);

    const handleDragStart = (e: React.DragEvent, item: StorageItem) => {
        // Check if we're dragging a selected item (multi-drag) or a single item
        const itemKey = getItemKey(item);
        const isItemSelected = selectedItems.has(itemKey);

        setDraggedItem(item);
        setIsDraggingSelection(isItemSelected && selectedItems.size > 1);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.name);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setIsDraggingSelection(false);
        setDropTargetFolder(null);
        setDropTargetBreadcrumb(null);
    };

    const handleDragOverFolder = (e: React.DragEvent, folderName: string) => {
        e.preventDefault();
        e.stopPropagation();
        // Ne pas permettre de drop sur soi-même ou sur un dossier sélectionné
        if (draggedItem?.name === folderName) return;
        if (isDraggingSelection && selectedItems.has(`folder:${folderName}`))
            return;
        e.dataTransfer.dropEffect = "move";
        setDropTargetFolder(folderName);
    };

    const handleDragLeaveFolder = () => {
        setDropTargetFolder(null);
    };

    const handleDropOnFolder = async (
        e: React.DragEvent,
        targetFolderName: string
    ) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTargetFolder(null);

        if (!draggedItem || draggedItem.name === targetFolderName) return;

        // Get items to move
        const itemsToMove = isDraggingSelection
            ? getSelectedItems().filter(
                  (item) => item.name !== targetFolderName
              )
            : [draggedItem];

        if (itemsToMove.length === 0) return;

        try {
            for (const item of itemsToMove) {
                const isFolder = !item.id;
                const oldPath = dirPath + item.name;
                const newPath = dirPath + targetFolderName + "/" + item.name;

                if (isFolder) {
                    await moveFolder(oldPath, newPath);
                } else {
                    await moveFile(oldPath, newPath);
                }
            }

            const count = itemsToMove.length;
            toast.success(
                count > 1
                    ? `${count} éléments déplacés`
                    : `${!itemsToMove[0].id ? "Dossier" : "Fichier"} déplacé`
            );
            clearSelection();
            fetchFiles();
        } catch (error) {
            console.error("Erreur lors du déplacement:", error);
            toast.error("Erreur lors du déplacement");
        }
    };

    const handleDragOverBreadcrumb = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        setDropTargetBreadcrumb(index);
    };

    const handleDragLeaveBreadcrumb = () => {
        setDropTargetBreadcrumb(null);
    };

    const handleDropOnBreadcrumb = async (
        e: React.DragEvent,
        index: number
    ) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTargetBreadcrumb(null);

        if (!draggedItem) return;

        // Calculer le chemin de destination
        const targetPath =
            index === -1
                ? ""
                : pathSegments.slice(0, index + 1).join("/") + "/";

        // Vérifier qu'on ne déplace pas au même endroit
        if (targetPath === dirPath) {
            toast.error("Les éléments sont déjà dans ce dossier");
            return;
        }

        // Get items to move
        const itemsToMove = isDraggingSelection
            ? getSelectedItems()
            : [draggedItem];

        if (itemsToMove.length === 0) return;

        try {
            for (const item of itemsToMove) {
                const isFolder = !item.id;
                const oldPath = dirPath + item.name;
                const newPath = targetPath + item.name;

                if (isFolder) {
                    await moveFolder(oldPath, newPath);
                } else {
                    await moveFile(oldPath, newPath);
                }
            }

            const count = itemsToMove.length;
            toast.success(
                count > 1
                    ? `${count} éléments déplacés`
                    : `${!itemsToMove[0].id ? "Dossier" : "Fichier"} déplacé`
            );
            clearSelection();
            fetchFiles();
        } catch (error) {
            console.error("Erreur lors du déplacement:", error);
            toast.error("Erreur lors du déplacement");
        }
    };

    // File upload handlers
    const handleFileSelect = useCallback(
        (selectedFiles: FileList | null) => {
            if (!selectedFiles || selectedFiles.length === 0) return;
            const filesArray = Array.from(selectedFiles);
            // Pass existing file names to handle duplicates (files with id are actual files, not folders)
            const existingFileNames = files
                .filter((f) => f.id)
                .map((f) => f.name);
            uploadFiles(filesArray, dirPath, existingFileNames);
        },
        [dirPath, uploadFiles, files]
    );

    const handleFileDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        if (e.dataTransfer.types.includes("Files")) {
            setIsDraggingFiles(true);
        }
    }, []);

    const handleFileDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setIsDraggingFiles(false);
        }
    }, []);

    const handleFileDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleFileDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current = 0;
            setIsDraggingFiles(false);

            const droppedFiles = e.dataTransfer.files;
            if (droppedFiles.length > 0) {
                handleFileSelect(droppedFiles);
            }
        },
        [handleFileSelect]
    );

    const folders = files
        .filter((f) => !f.id)
        .sort((a, b) => a.name.localeCompare(b.name));
    const regularFiles = files
        .filter((f) => f.id)
        .sort((a, b) => a.name.localeCompare(b.name));
    const sortedItems = [...folders, ...regularFiles];

    // Selection handlers
    const getItemKey = (item: StorageItem) => item.id ?? `folder:${item.name}`;

    const toggleSelection = useCallback((item: StorageItem) => {
        const key = getItemKey(item);
        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    }, []);

    const selectAll = useCallback(() => {
        const allKeys = sortedItems.map(getItemKey);
        setSelectedItems(new Set(allKeys));
    }, [sortedItems]);

    const clearSelection = useCallback(() => {
        setSelectedItems(new Set());
    }, []);

    const isSelected = useCallback(
        (item: StorageItem) => selectedItems.has(getItemKey(item)),
        [selectedItems]
    );

    // Clear selection when changing directory
    useEffect(() => {
        setSelectedItems(new Set());
    }, [dirPath]);

    const selectedCount = selectedItems.size;
    const allSelected =
        sortedItems.length > 0 && selectedCount === sortedItems.length;

    const getSelectedItems = useCallback(() => {
        return sortedItems.filter((item) =>
            selectedItems.has(getItemKey(item))
        );
    }, [sortedItems, selectedItems]);

    const handleDeleteMultiple = async () => {
        // Ne supprimer que les éléments que l'utilisateur peut modifier
        const items = getSelectedItems().filter((item) => canModify(item));
        if (items.length === 0) return;

        setDeletingMultiple(true);
        try {
            for (const item of items) {
                const isFolder = !item.id;
                const itemPath = dirPath + item.name;
                if (isFolder) {
                    await deleteFolder(itemPath);
                } else {
                    await deleteFile(itemPath);
                }
            }
            toast.success(
                `${items.length} élément${items.length > 1 ? "s" : ""} supprimé${items.length > 1 ? "s" : ""}`
            );
            setDeleteMultipleDialogOpen(false);
            clearSelection();
            fetchFiles();
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            toast.error("Erreur lors de la suppression");
        } finally {
            setDeletingMultiple(false);
        }
    };

    const handleDownloadMultiple = async () => {
        const items = getSelectedItems().filter((item) => item.id); // Only files
        for (const item of items) {
            try {
                const url = await getFileDownloadUrl(dirPath + item.name);
                window.open(url, "_blank");
            } catch (error) {
                console.error("Erreur téléchargement:", error);
            }
        }
    };

    const hasActiveUploads = uploadingFiles.length > 0;

    // Animation state for upload panel (closing animation)
    const [isClosingPanel, setIsClosingPanel] = useState(false);
    const prevHasActiveUploads = useRef(hasActiveUploads);

    useEffect(() => {
        // Detect transition from active -> empty
        if (prevHasActiveUploads.current && !hasActiveUploads) {
            setIsClosingPanel(true);
            const timer = setTimeout(() => setIsClosingPanel(false), 300);
            return () => clearTimeout(timer);
        }
        prevHasActiveUploads.current = hasActiveUploads;
    }, [hasActiveUploads]);

    const showUploadPanel = hasActiveUploads || isClosingPanel;

    return (
        <div
            className="flex flex-col h-full relative"
            onDragEnter={handleFileDragEnter}
            onDragLeave={handleFileDragLeave}
            onDragOver={handleFileDragOver}
            onDrop={handleFileDrop}
        >
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* Drag overlay */}
            {isDraggingFiles && (
                <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="border-2 border-dashed border-primary rounded-xl p-12 bg-primary/5">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="rounded-full bg-primary/10 p-4">
                                <Upload className="h-10 w-10 text-primary" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold">
                                    Déposez vos fichiers ici
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Les fichiers seront importés dans le dossier
                                    actuel
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <header className="border-b bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <HardDrive className="h-5 w-5 text-primary shrink-0" />
                        <nav className="flex items-center gap-1 text-sm min-w-0">
                            <button
                                onClick={() => goToPath(-1)}
                                onDragOver={(e) =>
                                    handleDragOverBreadcrumb(e, -1)
                                }
                                onDragLeave={handleDragLeaveBreadcrumb}
                                onDrop={(e) => handleDropOnBreadcrumb(e, -1)}
                                className={`font-medium transition-all px-2 py-1 rounded ${
                                    dropTargetBreadcrumb === -1
                                        ? "bg-primary/20 text-primary ring-2 ring-primary"
                                        : pathSegments.length === 0
                                          ? "text-foreground"
                                          : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Drive
                            </button>
                            {pathSegments.map((segment, index) => (
                                <span
                                    key={segment + index}
                                    className="flex items-center gap-1 min-w-0 select-none"
                                >
                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <button
                                        onClick={() => goToPath(index)}
                                        onDragOver={(e) =>
                                            handleDragOverBreadcrumb(e, index)
                                        }
                                        onDragLeave={handleDragLeaveBreadcrumb}
                                        onDrop={(e) =>
                                            handleDropOnBreadcrumb(e, index)
                                        }
                                        className={`transition-all truncate max-w-[150px] px-2 py-1 rounded ${
                                            dropTargetBreadcrumb === index
                                                ? "bg-primary/20 text-primary ring-2 ring-primary"
                                                : index ===
                                                    pathSegments.length - 1
                                                  ? "text-foreground font-medium"
                                                  : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {segment}
                                    </button>
                                </span>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            <Upload className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Importer</span>
                        </Button>

                        <Dialog
                            open={newFolderOpen}
                            onOpenChange={setNewFolderOpen}
                        >
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <FolderPlus className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">
                                        Nouveau dossier
                                    </span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Créer un dossier</DialogTitle>
                                    <DialogDescription>
                                        Entrez le nom du nouveau dossier
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 py-4">
                                    <Label htmlFor="folder-name">Nom</Label>
                                    <Input
                                        id="folder-name"
                                        placeholder="Mon dossier"
                                        value={newFolderName}
                                        onChange={(e) =>
                                            setNewFolderName(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === "Enter" &&
                                            handleCreateFolder()
                                        }
                                        autoFocus
                                    />
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setNewFolderOpen(false)}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={handleCreateFolder}
                                        disabled={creatingFolder}
                                    >
                                        {creatingFolder && (
                                            <LoadingSpinner className="mr-2 h-4 w-4" />
                                        )}
                                        Créer
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>

            {/* Selection action bar */}
            {selectedCount > 0 && (
                <div className="border-b bg-muted/50 px-6 py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-4">
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    selectAll();
                                } else {
                                    clearSelection();
                                }
                            }}
                        />
                        <span className="text-sm font-medium">
                            {selectedCount} élément
                            {selectedCount > 1 ? "s" : ""} sélectionné
                            {selectedCount > 1 ? "s" : ""}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSelection}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Annuler
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        {getSelectedItems().some((item) => item.id) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadMultiple}
                            >
                                <Download className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">
                                    Télécharger
                                </span>
                            </Button>
                        )}
                        {getSelectedItems().some((item) => canModify(item)) && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                    setDeleteMultipleDialogOpen(true)
                                }
                            >
                                <Trash2 className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">
                                    Supprimer
                                </span>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : sortedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <Folder className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium mb-1">
                            Ce dossier est vide
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Créez un dossier pour commencer à organiser vos
                            fichiers
                        </p>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {sortedItems.map((item) => {
                                const isFolder = !item.id;
                                const { icon: Icon, className: iconClass } =
                                    isFolder
                                        ? FOLDER_ICON
                                        : getFileIcon(item.name);
                                const isDragging =
                                    draggedItem?.name === item.name;
                                const isDropTarget =
                                    isFolder && dropTargetFolder === item.name;
                                const itemSelected = isSelected(item);

                                // Check if this item is being dragged as part of selection
                                const isDraggedInSelection =
                                    isDraggingSelection && itemSelected;

                                return (
                                    <div
                                        key={item.id ?? item.name}
                                        draggable
                                        onDragStart={(e) =>
                                            handleDragStart(e, item)
                                        }
                                        onDragEnd={handleDragEnd}
                                        onDragOver={
                                            isFolder && !itemSelected
                                                ? (e) =>
                                                      handleDragOverFolder(
                                                          e,
                                                          item.name
                                                      )
                                                : undefined
                                        }
                                        onDragLeave={
                                            isFolder && !itemSelected
                                                ? handleDragLeaveFolder
                                                : undefined
                                        }
                                        onDrop={
                                            isFolder && !itemSelected
                                                ? (e) =>
                                                      handleDropOnFolder(
                                                          e,
                                                          item.name
                                                      )
                                                : undefined
                                        }
                                        className={`group relative flex flex-col items-center p-4 rounded-xl border bg-card transition-all select-none ${
                                            isDragging || isDraggedInSelection
                                                ? "opacity-50 scale-95"
                                                : itemSelected
                                                  ? "bg-primary/10 border-primary ring-2 ring-primary"
                                                  : isDropTarget
                                                    ? "bg-primary/10 border-primary ring-2 ring-primary scale-105"
                                                    : "hover:bg-muted/50 hover:border-muted-foreground/20"
                                        } ${isFolder || getPreviewType(item.name) ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
                                        onClick={(e) => {
                                            if (selectedCount > 0) {
                                                e.stopPropagation();
                                                toggleSelection(item);
                                            } else if (
                                                isFolder &&
                                                !isDragging
                                            ) {
                                                openFolder(item.name);
                                            } else if (
                                                !isFolder &&
                                                getPreviewType(item.name)
                                            ) {
                                                handlePreviewClick(item);
                                            }
                                        }}
                                    >
                                        {/* Checkbox */}
                                        <div
                                            className={`absolute top-2 left-2 transition-opacity ${
                                                selectedCount > 0 ||
                                                itemSelected
                                                    ? "opacity-100"
                                                    : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                            }`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                checked={itemSelected}
                                                onCheckedChange={() =>
                                                    toggleSelection(item)
                                                }
                                                className="h-5 w-5"
                                            />
                                        </div>
                                        {/* Menu */}
                                        <div
                                            className={`absolute top-2 right-2 transition-opacity ${
                                                selectedCount > 0
                                                    ? "opacity-0"
                                                    : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                            }`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {!isFolder &&
                                                        getPreviewType(
                                                            item.name
                                                        ) && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handlePreviewClick(
                                                                        item
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Aperçu
                                                            </DropdownMenuItem>
                                                        )}
                                                    {!isFolder && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleDownload(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Télécharger
                                                        </DropdownMenuItem>
                                                    )}
                                                    {canModify(item) && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleRenameClick(
                                                                        item
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                Renommer
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() =>
                                                                    handleDeleteClick(
                                                                        item
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted/50 mb-3">
                                            <Icon
                                                className={`h-8 w-8 ${iconClass}`}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-center line-clamp-2 break-all leading-tight">
                                            {item.name}
                                        </span>
                                        {!isFolder && (
                                            <div className="flex items-center gap-1.5 mt-2">
                                                {item.owner ? (
                                                    <>
                                                        <Avatar className="h-4 w-4">
                                                            <AvatarImage
                                                                src={
                                                                    item.owner
                                                                        .avatar_url ||
                                                                    undefined
                                                                }
                                                                alt={`${item.owner.first_name || ""} ${item.owner.last_name || ""}`}
                                                            />
                                                            <AvatarFallback className="text-[8px]">
                                                                {(
                                                                    item.owner
                                                                        .first_name?.[0] ||
                                                                    ""
                                                                ).toUpperCase()}
                                                                {(
                                                                    item.owner
                                                                        .last_name?.[0] ||
                                                                    ""
                                                                ).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                                            {item.owner
                                                                .first_name ||
                                                                ""}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                                {item.metadata?.size && (
                                                    <>
                                                        <span className="text-xs text-muted-foreground">
                                                            •
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatFileSize(
                                                                item.metadata
                                                                    .size
                                                            )}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* Upload progress panel */}
            {showUploadPanel && (
                <div
                    className={`fixed bottom-4 right-4 z-40 w-96 max-w-[calc(100vw-2rem)] bg-background border rounded-xl shadow-lg transition-all duration-300 ${
                        isClosingPanel
                            ? "animate-out fade-out slide-out-to-bottom-5"
                            : "animate-in fade-in slide-in-from-bottom-5"
                    }`}
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">
                                {isUploading
                                    ? `Import en cours... ${totalProgress}%`
                                    : `${completedCount} fichier${completedCount > 1 ? "s" : ""} importé${completedCount > 1 ? "s" : ""}`}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={cancelAllUploads}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    {isUploading && (
                        <Progress
                            value={totalProgress}
                            className="h-1 rounded-none"
                        />
                    )}
                    <div className="max-h-48 overflow-y-auto p-2">
                        {uploadingFiles.map((uf) => {
                            const { icon: FileIcon, className: iconClass } =
                                getFileIcon(uf.name);
                            return (
                                <div
                                    key={uf.id}
                                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50"
                                >
                                    <FileIcon
                                        className={`h-5 w-5 shrink-0 ${iconClass}`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">
                                            {uf.name}
                                        </p>
                                        {uf.status === "uploading" && (
                                            <Progress
                                                value={uf.progress}
                                                className="h-1 mt-1"
                                            />
                                        )}
                                        {uf.status === "error" && (
                                            <p className="text-xs text-destructive truncate">
                                                {uf.error}
                                            </p>
                                        )}
                                    </div>
                                    <div className="shrink-0">
                                        {uf.status === "completed" && (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        )}
                                        {uf.status === "error" && (
                                            <XCircle className="h-5 w-5 text-destructive" />
                                        )}
                                        {(uf.status === "uploading" ||
                                            uf.status === "pending") && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() =>
                                                    cancelUpload(uf.id)
                                                }
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Confirmer la suppression
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer{" "}
                            <span className="font-medium text-foreground">
                                {itemToDelete?.name}
                            </span>{" "}
                            ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={deleting}
                        >
                            {deleting && (
                                <LoadingSpinner className="mr-2 h-4 w-4" />
                            )}
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={deleteMultipleDialogOpen}
                onOpenChange={setDeleteMultipleDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Confirmer la suppression
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer{" "}
                            <span className="font-medium text-foreground">
                                {selectedCount} élément
                                {selectedCount > 1 ? "s" : ""}
                            </span>{" "}
                            ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteMultiple}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={deletingMultiple}
                        >
                            {deletingMultiple && (
                                <LoadingSpinner className="mr-2 h-4 w-4" />
                            )}
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renommer</DialogTitle>
                        <DialogDescription>
                            Entrez le nouveau nom pour{" "}
                            <span className="font-medium text-foreground">
                                {itemToRename?.name}
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label htmlFor="rename-input">Nouveau nom</Label>
                        <Input
                            id="rename-input"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleConfirmRename()
                            }
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRenameDialogOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleConfirmRename}
                            disabled={renaming}
                        >
                            {renaming && (
                                <LoadingSpinner className="mr-2 h-4 w-4" />
                            )}
                            Renommer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog
                open={!!previewItem}
                onOpenChange={(open) => !open && closePreview()}
            >
                <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 overflow-hidden">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle className="truncate">
                            {previewItem?.name}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Prévisualisation du fichier {previewItem?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center justify-center p-4 min-h-[300px] max-h-[calc(90vh-100px)] overflow-auto">
                        {previewLoading ? (
                            <LoadingSpinner size="lg" />
                        ) : previewUrl && previewItem ? (
                            (() => {
                                const type = getPreviewType(previewItem.name);
                                switch (type) {
                                    case "image":
                                        return (
                                            <img
                                                src={previewUrl}
                                                alt={previewItem.name}
                                                className="max-w-full max-h-[calc(90vh-150px)] object-contain rounded-lg"
                                            />
                                        );
                                    case "video":
                                        return (
                                            <video
                                                src={previewUrl}
                                                controls
                                                autoPlay
                                                className="max-w-full max-h-[calc(90vh-150px)] rounded-lg"
                                            >
                                                Votre navigateur ne supporte pas
                                                la lecture vidéo.
                                            </video>
                                        );
                                    case "audio":
                                        return (
                                            <div className="flex flex-col items-center gap-6 p-8">
                                                <div className="rounded-full bg-muted p-8">
                                                    <FileAudio className="h-16 w-16 text-green-500" />
                                                </div>
                                                <audio
                                                    src={previewUrl}
                                                    controls
                                                    autoPlay
                                                    className="w-full max-w-md"
                                                >
                                                    Votre navigateur ne supporte
                                                    pas la lecture audio.
                                                </audio>
                                            </div>
                                        );
                                    case "pdf":
                                        return (
                                            <iframe
                                                src={previewUrl}
                                                title={previewItem.name}
                                                className="w-full h-[calc(90vh-150px)] rounded-lg border-0"
                                            />
                                        );
                                    default:
                                        return null;
                                }
                            })()
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
