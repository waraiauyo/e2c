"use client";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
    setSearchQuery,
    setLevelFilter,
    setAllophoneFilter,
} from "@/lib/redux/features/clas/slice";
import { selectClasFilters } from "@/lib/redux/features/clas/selectors";
import { Label } from "@/components/shadcn/label";
import { Input } from "@/components/shadcn/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/shadcn/select";

export function MapsSidebar() {
    const dispatch = useAppDispatch();
    const filters = useAppSelector(selectClasFilters);

    return (
        <div className="p-4 space-y-4">
            <div>
                <h3 className="font-semibold text-sm mb-3">Rechercher un CLAS</h3>
                <Input
                    type="text"
                    placeholder="Ville ou nom du CLAS..."
                    value={filters.searchQuery}
                    onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                />
            </div>

            <div className="pt-4 border-t">
                <h3 className="font-semibold text-sm mb-3">Filtres</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Niveau scolaire
                        </Label>
                        <Select
                            value={filters.level}
                            onValueChange={(
                                value: "all" | "primaire" | "college"
                            ) => dispatch(setLevelFilter(value))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choisir un niveau" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Tous les niveaux
                                </SelectItem>
                                <SelectItem value="primaire">
                                    Primaire
                                </SelectItem>
                                <SelectItem value="college">
                                    Collège
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Accueil Allophones
                        </Label>
                        <Select
                            value={filters.allophone}
                            onValueChange={(value: "all" | "yes" | "no") =>
                                dispatch(setAllophoneFilter(value))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Peu importe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Peu importe
                                </SelectItem>
                                <SelectItem value="yes">Oui</SelectItem>
                                <SelectItem value="no">Non</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                    {filters.searchQuery || filters.level !== "all" || filters.allophone !== "all"
                        ? "Filtres actifs"
                        : "Aucun filtre actif"}
                </p>
            </div>
        </div>
    );
}
