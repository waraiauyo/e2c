"use client";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
    setSearchQuery,
    setLevelFilter,
    setAllophoneFilter,
} from "@/lib/redux/features/clas/slice";
import {
    selectClasFilters,
    selectUniqueLevels,
    selectFilteredClas,
} from "@/lib/redux/features/clas/selectors";
import { Label } from "@/components/shadcn/label";
import { Input } from "@/components/shadcn/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/shadcn/select";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { MapPin, Users } from "lucide-react";

interface MapSidebarProps {
    onClasSelect?: (clasId: string, lat: number, lng: number) => void;
}

export function MapSidebar({ onClasSelect }: MapSidebarProps) {
    const dispatch = useAppDispatch();
    const filters = useAppSelector(selectClasFilters);
    const uniqueLevels = useAppSelector(selectUniqueLevels);
    const filteredClas = useAppSelector(selectFilteredClas);

    return (
        <div className="flex flex-col h-full">
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
                                onValueChange={(value: string) =>
                                    dispatch(setLevelFilter(value))
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choisir un niveau" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tous les niveaux
                                    </SelectItem>
                                    {uniqueLevels.map((level) => (
                                        <SelectItem key={level} value={level}>
                                            {level}
                                        </SelectItem>
                                    ))}
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
            </div>

            <div className="flex-1 border-t overflow-hidden">
                <div className="p-4 pb-2">
                    <h3 className="font-semibold text-sm">
                        CLAS ({filteredClas.length})
                    </h3>
                </div>
                <ScrollArea className="h-[calc(100%-3rem)] px-4">
                    <div className="space-y-2 pb-4">
                        {filteredClas.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                Aucun CLAS trouvé
                            </p>
                        ) : (
                            filteredClas.map((clas) => (
                                <button
                                    key={clas.id}
                                    onClick={() => {
                                        if (
                                            onClasSelect &&
                                            clas.latitude &&
                                            clas.longitude
                                        ) {
                                            onClasSelect(
                                                clas.id,
                                                clas.latitude,
                                                clas.longitude
                                            );
                                        }
                                    }}
                                    className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                                >
                                    <h4 className="font-medium text-sm">
                                        {clas.name}
                                    </h4>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate">
                                            {clas.location || "Adresse non renseignée"}
                                        </span>
                                    </div>
                                    {clas.capacity && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <Users className="h-3 w-3" />
                                            <span>{clas.capacity} élèves</span>
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
