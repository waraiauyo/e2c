"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/redux/hooks";
import { getAllClas, getUserClasWithRoles } from "@/lib/supabase/query/clas";
import { Label } from "@/components/shadcn/label";
import { RadioGroup, RadioGroupItem } from "@/components/shadcn/radio-group";
import { Skeleton } from "@/components/shadcn/skeleton";

export type FilterContext = {
    type: "personal" | "clas";
    id: string; // user_id pour personal, clas_id pour clas
    name: string;
};

interface FilterSidebarProps {
    selectedContext: FilterContext | null;
    onContextChange: (context: FilterContext) => void;
}

export function FilterSidebar({ selectedContext, onContextChange }: FilterSidebarProps) {
    const { profile, user } = useAppSelector((state) => state.user);
    const [clasList, setClasList] = useState<{ id: string; name: string; role?: string }[]>([]);
    const [isLoadingClas, setIsLoadingClas] = useState(true);

    const isAdmin = profile?.account_type === "admin";
    const userId = user?.id || profile?.id;

    // Charger les CLAS de l'utilisateur
    useEffect(() => {
        async function loadClas() {
            if (!userId) {
                setIsLoadingClas(false);
                return;
            }

            setIsLoadingClas(true);

            if (isAdmin) {
                // Admin voit tous les CLAS
                const result = await getAllClas();
                if (result.clas) {
                    setClasList(result.clas.map((c) => ({ id: c.id, name: c.name })));
                }
            } else {
                // Coordinator/Animator voient leurs CLAS avec rôles
                const result = await getUserClasWithRoles(userId);
                if (result.clas) {
                    setClasList(result.clas);
                }
            }

            setIsLoadingClas(false);
        }

        loadClas();
    }, [userId, isAdmin]);

    // Sélectionner le planning personnel par défaut
    useEffect(() => {
        if (!selectedContext && userId) {
            onContextChange({
                type: "personal",
                id: userId,
                name: "Mon planning personnel",
            });
        }
    }, [selectedContext, userId, onContextChange]);

    const handleContextChange = (value: string) => {
        if (value === "personal" && userId) {
            onContextChange({
                type: "personal",
                id: userId,
                name: "Mon planning personnel",
            });
        } else {
            const clas = clasList.find((c) => c.id === value);
            if (clas) {
                onContextChange({
                    type: "clas",
                    id: clas.id,
                    name: clas.name,
                });
            }
        }
    };

    if (!userId) {
        return (
            <div className="p-4">
                <p className="text-sm text-muted-foreground">
                    Vous devez être connecté pour voir les filtres
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div>
                <h3 className="font-semibold text-sm mb-3">Affichage</h3>

                {isLoadingClas ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                    <RadioGroup
                        value={selectedContext?.type === "personal" ? "personal" : selectedContext?.id}
                        onValueChange={handleContextChange}
                    >
                        {/* Option planning personnel */}
                        <Label
                            htmlFor="personal"
                            className="flex items-center space-x-2 p-3 rounded-md hover:bg-accent cursor-pointer"
                        >
                            <RadioGroupItem value="personal" id="personal" />
                            <span className="flex-1">Mon planning personnel</span>
                        </Label>

                        {/* Options CLAS */}
                        {clasList.map((clas) => (
                            <Label
                                key={clas.id}
                                htmlFor={clas.id}
                                className="flex items-center space-x-2 p-3 rounded-md hover:bg-accent cursor-pointer"
                            >
                                <RadioGroupItem value={clas.id} id={clas.id} />
                                <div className="flex flex-col flex-1">
                                    <span>{clas.name}</span>
                                    {clas.role && (
                                        <span className="text-xs text-muted-foreground">
                                            {clas.role === "coordinator" ? "Coordinateur" : "Animateur"}
                                        </span>
                                    )}
                                </div>
                            </Label>
                        ))}

                        {clasList.length === 0 && (
                            <p className="text-sm text-muted-foreground p-3">
                                Aucun CLAS disponible
                            </p>
                        )}
                    </RadioGroup>
                )}
            </div>

            <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                    {selectedContext?.type === "personal"
                        ? "Affichage de vos événements personnels"
                        : `Affichage des événements de ${selectedContext?.name}`}
                </p>
            </div>
        </div>
    );
}
