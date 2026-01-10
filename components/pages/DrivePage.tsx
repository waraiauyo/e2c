"use client";

import { Button } from "@/components/shadcn/button";
import { getFilesAndFolders } from "@/lib/supabase/query/storage";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function DrivePage() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dirPath, setDirPath] = useState(""); // Pas la peine de "/" en début c'est géré tout seul

    const openFolder = (folderName: string) => {
        setDirPath((prev) => `${prev}${folderName}/`);
    };

    const goBack = () => {
        setDirPath((prev) => {
            const segments = prev.split("/").filter(Boolean);
            segments.pop();
            return segments.length > 0 ? `${segments.join("/")}/` : "";
        });
    };

    useEffect(() => {
        const fetchFilesAndFolder = async () => {
            setLoading(true);

            try {
                setFiles(await getFilesAndFolders(dirPath));
            } catch (error) {
                console.error("Erreur lors du chargement:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFilesAndFolder();
    }, [dirPath]);

    return (
        <div className="flex flex-col gap-4">
            <p className="text-xl font-bold">DRIVE PROTOTYPE</p>
            <p>Chemin actuel : /{dirPath}</p>
            <Button onClick={goBack} size="icon" disabled={dirPath === ""}>
                <ArrowLeft />
            </Button>
            {loading ? (
                <p>Chargement...</p>
            ) : (
                <div className="flex flex-wrap gap-4">
                    {files.map((file) => {
                        const isFolder = !file.id;

                        return (
                            <div
                                key={file.name}
                                className="flex flex-col justify-center items-center border-4 select-none cursor-pointer"
                                onClick={
                                    isFolder
                                        ? () => openFolder(file.name)
                                        : undefined
                                }
                            >
                                {isFolder ? "DOSSIERS" : "FICHIERS"}
                                <span>{file.name}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
