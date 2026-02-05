import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
    setSearchQuery,
    setLevelFilter,
    setAllophoneFilter,
} from "@/lib/redux/features/clas/slice";
import {
    selectClasFilters,
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
import { MapPin, Users, Search } from "lucide-react";

interface MapSidebarProps {
    onClasSelect?: (clasId: string, lat: number, lng: number) => void;
}

export function MapSidebar({ onClasSelect }: MapSidebarProps) {
    const dispatch = useAppDispatch();
    const filters = useAppSelector(selectClasFilters);
    const filteredClas = useAppSelector(selectFilteredClas);

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10">
            {/* Header avec Fond subtil Bleu/Gris */}
            <div className="p-5 space-y-5 bg-gradient-to-b from-[#F4F4F4] to-white">
                <div>
                    <h3 className="font-bold text-[#005E84] text-base mb-3 flex items-center gap-2">
                        <Search className="w-4 h-4 text-[#DEAA00]" />
                        Rechercher un CLAS
                    </h3>
                    <Input
                        type="text"
                        placeholder="Ville ou nom du CLAS..."
                        value={filters.searchQuery}
                        onChange={(e) =>
                            dispatch(setSearchQuery(e.target.value))
                        }
                        className="bg-white border-[#E2E8F0] focus-visible:ring-[#DEAA00] focus-visible:border-[#DEAA00] transition-colors shadow-sm"
                    />
                </div>

                <div className="pt-4 border-t border-[#E2E8F0]">
                    <h3 className="font-bold text-[#005E84] text-sm mb-3">
                        Filtres
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#1E3231]/80 uppercase tracking-wider">
                                Niveau
                            </Label>
                            <Select
                                value={filters.level}
                                onValueChange={(value: string) =>
                                    dispatch(setLevelFilter(value))
                                }
                            >
                                <SelectTrigger className="w-full bg-white border-[#E2E8F0] focus:ring-[#DEAA00] text-xs h-9">
                                    <SelectValue placeholder="Niveau" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous</SelectItem>
                                    <SelectItem value="primary">
                                        Primaire
                                    </SelectItem>
                                    <SelectItem value="middle_school">
                                        Collège
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#1E3231]/80 uppercase tracking-wider">
                                Allophones
                            </Label>
                            <Select
                                value={filters.allophone}
                                onValueChange={(value: "all" | "yes" | "no") =>
                                    dispatch(setAllophoneFilter(value))
                                }
                            >
                                <SelectTrigger className="w-full bg-white border-[#E2E8F0] focus:ring-[#DEAA00] text-xs h-9">
                                    <SelectValue placeholder="Choix" />
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

            <div className="flex-1 overflow-hidden bg-white">
                <div className="px-5 py-3 border-b border-[#F4F4F4] flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#005E84]">
                        Résultats
                    </h3>
                    <span className="bg-[#E9B44C] text-[#1E3231] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {filteredClas.length}
                    </span>
                </div>

                <ScrollArea className="h-[calc(100%-3rem)]">
                    <div className="p-4 space-y-3">
                        {filteredClas.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-muted-foreground">
                                    Aucun CLAS ne correspond à votre recherche.
                                </p>
                            </div>
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
                                    className="w-full text-left p-3 rounded-xl border border-transparent bg-white shadow-sm hover:shadow-md hover:border-[#E9B44C] hover:bg-[#FDF8E8] transition-all duration-200 group relative overflow-hidden"
                                >
                                    {/* Barre latérale décorative bleue au survol */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#005E84] opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="pl-2">
                                        <h4 className="font-bold text-sm text-[#1E3231] group-hover:text-[#005E84] transition-colors">
                                            {clas.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-[#DEAA00]" />
                                            <span className="truncate">
                                                {clas.location ||
                                                    "Adresse non renseignée"}
                                            </span>
                                        </div>
                                        {clas.capacity && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                <Users className="h-3.5 w-3.5 text-[#005E84]/60" />
                                                <span>
                                                    {clas.capacity} élèves
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
